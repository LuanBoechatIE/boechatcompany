// Camada de dados do Sales Command Center. Centraliza busca, enriquecimento de
// DTOs, filtros avançados e todas as métricas (KPIs, buckets operacionais,
// funil de prospecção e "Minha fila"). Espelha o padrão de dashboard-data.ts.
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  leads,
  leadAtividades,
  leadChecklist,
  leadArquivos,
  leadFiltrosSalvos,
  metasProspeccao,
  type Lead,
  type LeadAtividade,
} from "@/app/lib/db/schema";
import {
  LEAD_STAGES,
  isInteracao,
  ACAO_LABEL,
  type LeadDTO,
  type AtividadeDTO,
  type ChecklistDTO,
  type ArquivoDTO,
  type FiltroSalvoDTO,
  type LeadStatus,
  type LeadFlag,
  type FollowUpStatus,
  type Prioridade,
  type AcaoTipo,
  type ProximaAcaoRec,
} from "./types";
import { computeLeadScore, temperaturaDoScore } from "./lead-score";
import { CADENCIA, quandoLabel } from "./lead-engine";

const DIA = 24 * 60 * 60 * 1000;

// ── Helpers de data ──────────────────────────────────────────────────────────
const dtBR = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dtCurto = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const iso = (d: Date) => d.toISOString().slice(0, 10);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function relativo(d: Date, now: number): string {
  const dias = Math.floor((startOfDay(new Date(now)).getTime() - startOfDay(d).getTime()) / DIA);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

function tamanhoLabel(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const num = (v: unknown) => (v == null ? 0 : Number(v));

// ── Enriquecimento de um lead ────────────────────────────────────────────────
export function enrichLead(
  l: Lead,
  ativs: LeadAtividade[],
  now: number,
): LeadDTO {
  const interacoes = ativs.filter((a) => isInteracao(a.tipo));
  const numInteracoes = interacoes.length;
  const numAtividades = ativs.length;
  const tentativasLigacao = ativs.filter((a) => a.tipo === "ligacao" || a.canal === "ligacao").length;
  const tentativas = ativs.filter(
    (a) => a.tipo === "ligacao" || a.tipo === "whatsapp" || a.canal === "ligacao" || a.canal === "whatsapp",
  ).length;

  // Última interação: prioriza a coluna, cai pra maior data de interação.
  const ultInterAtiv = interacoes.reduce<number | null>((max, a) => {
    const t = a.criadoEm.getTime();
    return max == null || t > max ? t : max;
  }, null);
  const ultimaInteracaoMs = l.ultimaInteracaoEm
    ? l.ultimaInteracaoEm.getTime()
    : ultInterAtiv;

  // Última movimentação (pra "tempo parado"): maior entre atualização, última
  // atividade de qualquer tipo e criação.
  const ultAtivMs = ativs.reduce<number>((max, a) => Math.max(max, a.criadoEm.getTime()), 0);
  const ultimaMovimentacaoMs = Math.max(
    l.atualizadoEm?.getTime() ?? 0,
    ultAtivMs,
    l.criadoEm.getTime(),
  );

  const diasSemInteracao =
    ultimaInteracaoMs == null
      ? null
      : Math.floor((startOfDay(new Date(now)).getTime() - startOfDay(new Date(ultimaInteracaoMs)).getTime()) / DIA);
  const diasDesdeCriacao = Math.floor(
    (startOfDay(new Date(now)).getTime() - startOfDay(l.criadoEm).getTime()) / DIA,
  );
  const diasParado = Math.floor(
    (startOfDay(new Date(now)).getTime() - startOfDay(new Date(ultimaMovimentacaoMs)).getTime()) / DIA,
  );

  const valorEstimado = l.valorEstimado != null ? Number(l.valorEstimado) : null;
  const fechado = l.status === "convertido" || l.status === "perdido";

  // Follow-up (próximo contato).
  const prox = l.proximoContato ? new Date(l.proximoContato) : null;
  let followUpStatus: FollowUpStatus = "nenhum";
  if (prox && !fechado) {
    const hoje = startOfDay(new Date(now)).getTime();
    const proxDia = startOfDay(prox).getTime();
    followUpStatus = proxDia < hoje ? "atrasado" : proxDia === hoje ? "hoje" : "futuro";
  }
  const atrasado = followUpStatus === "atrasado";

  // Score: respeita override manual (scoreFixo), senão calcula por regras.
  const leadScore =
    l.scoreFixo != null
      ? l.scoreFixo
      : computeLeadScore(
          {
            status: l.status as LeadStatus,
            valorEstimado,
            ultimaInteracaoEm: ultimaInteracaoMs ? new Date(ultimaInteracaoMs) : null,
            numInteracoes,
          },
          now,
        );
  const temperatura = temperaturaDoScore(leadScore);

  // Próxima ação recomendada pelo motor de cadência.
  const acaoTipo = (l.proximaAcaoTipo as AcaoTipo) || "ligar";
  const encerrado = l.encerrado || l.status === "convertido";
  let proximaAcaoRec: ProximaAcaoRec;
  if (encerrado || l.status === "perdido") {
    proximaAcaoRec = { tipo: "nenhuma", label: "Encerrado", quandoLabel: "—", atrasada: false };
  } else if (prox) {
    proximaAcaoRec = {
      tipo: acaoTipo,
      label: l.proximaAcao || ACAO_LABEL[acaoTipo],
      quandoLabel: quandoLabel(prox, new Date(now)),
      atrasada: prox.getTime() < now,
    };
  } else {
    // Sem agendamento: recomenda o passo atual da cadência (default: ligar agora).
    const passo = CADENCIA[l.cadenciaPasso] ?? CADENCIA[0];
    proximaAcaoRec = {
      tipo: passo.tipo,
      label: passo.label,
      quandoLabel: "agora",
      atrasada: false,
    };
  }

  // Bandeiras visuais.
  const flags: LeadFlag[] = [];
  if (atrasado) flags.push("atrasado");
  else if (followUpStatus === "hoje") flags.push("hoje");
  if (diasSemInteracao != null && diasSemInteracao <= 2) flags.push("recente");
  else if ((diasSemInteracao ?? 999) >= 7 && !fechado) flags.push("atencao");
  if (temperatura === "quente" && !fechado) flags.push("quente");
  if ((l.prioridade === "alta" || l.prioridade === "urgente") && !fechado) flags.push("prioridade");
  if (valorEstimado != null && valorEstimado >= 5000) flags.push("potencial");

  return {
    id: l.id,
    nome: l.nome,
    empresa: l.empresa,
    pessoaContato: l.pessoaContato,
    telefone: l.telefone,
    email: l.email,
    whatsapp: l.whatsapp,
    servico: l.servico,
    responsavel: l.responsavel,
    origem: l.origem,
    valorEstimado: l.valorEstimado,
    proximaAcao: l.proximaAcao,
    tags: l.tags,
    observacoes: l.observacoes,
    status: l.status as LeadStatus,
    motivoPerda: l.motivoPerda,
    prioridade: (l.prioridade as Prioridade) || "media",
    leadScore,
    scoreFixo: l.scoreFixo ?? null,
    temperatura,
    numInteracoes,
    numAtividades,
    proximoContatoResponsavel: l.proximoContatoResponsavel,
    usuarioId: l.usuarioId ?? null,
    followUpStatus,
    flags,
    cadenciaPasso: l.cadenciaPasso,
    tentativas,
    tentativasLigacao,
    encerrado,
    motivoEncerramento: l.motivoEncerramento,
    proximaAcaoRec,
    proximoContatoHoraLabel: prox
      ? prox.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : null,
    reuniaoEventoId: l.reuniaoEventoId ?? null,
    reuniaoMeetLink: l.reuniaoMeetLink ?? "",
    reuniaoTipo: l.reuniaoTipo ?? "",
    criadoEmLabel: dtBR(l.criadoEm),
    criadoEmMs: l.criadoEm.getTime(),
    atualizadoEmLabel: l.atualizadoEm ? dtBR(l.atualizadoEm) : null,
    atualizadoEmMs: l.atualizadoEm?.getTime() ?? null,
    ultimaInteracaoLabel: ultimaInteracaoMs ? relativo(new Date(ultimaInteracaoMs), now) : null,
    ultimaInteracaoMs,
    diasSemInteracao,
    diasDesdeCriacao,
    diasParado,
    proximoContatoLabel: prox ? dtCurto(prox) : null,
    proximoContatoInput: prox ? iso(prox) : "",
    proximoContatoMs: prox?.getTime() ?? null,
    atrasado,
  };
}

export function atividadeToDTO(a: LeadAtividade): AtividadeDTO {
  return {
    id: a.id,
    tipo: a.tipo,
    texto: a.texto,
    dataLabel: a.data ? dtBR(new Date(a.data)) : null,
    feito: a.feito,
    autor: a.autor,
    campo: a.campo ?? "",
    valorAnterior: a.valorAnterior ?? "",
    valorNovo: a.valorNovo ?? "",
    resultado: a.resultado ?? "",
    canal: a.canal ?? "",
    criadoEmLabel: dtBR(a.criadoEm),
    criadoEmMs: a.criadoEm.getTime(),
    interacao: isInteracao(a.tipo),
  };
}

// ── Filtros avançados ────────────────────────────────────────────────────────
export type LeadFilters = {
  q?: string;
  responsavel?: string;
  origem?: string;
  servico?: string;
  status?: string;
  prioridade?: string;
  tag?: string;
  temperatura?: string;
  followup?: string; // hoje | atrasado | futuro | sem
  criados?: string; // hoje | semana
  modificados?: string; // hoje | semana
  semInteracao?: string; // nº de dias
  semResponsavel?: string; // "1"
  ganhos?: string; // "1"
  perdidos?: string; // "1"
  valorMin?: string;
  valorMax?: string;
};

export function parseFilters(sp: Record<string, string | undefined>): LeadFilters {
  const f: LeadFilters = {};
  for (const k of [
    "q", "responsavel", "origem", "servico", "status", "prioridade", "tag",
    "temperatura", "followup", "criados", "modificados", "semInteracao",
    "semResponsavel", "ganhos", "perdidos", "valorMin", "valorMax",
  ] as const) {
    const v = sp[k];
    if (v != null && v !== "") f[k] = v;
  }
  return f;
}

export function temFiltroAtivo(f: LeadFilters): boolean {
  return Object.keys(f).length > 0;
}

function passaFiltro(l: LeadDTO, f: LeadFilters, now: number): boolean {
  if (f.responsavel && l.responsavel !== f.responsavel) return false;
  if (f.origem && l.origem !== f.origem) return false;
  if (f.servico && l.servico !== f.servico) return false;
  if (f.status && l.status !== f.status) return false;
  if (f.prioridade && l.prioridade !== f.prioridade) return false;
  if (f.temperatura && l.temperatura !== f.temperatura) return false;
  if (f.tag) {
    const alvo = f.tag.toLowerCase();
    const tags = l.tags.toLowerCase();
    if (!tags.split(",").map((t) => t.trim()).includes(alvo)) return false;
  }
  if (f.followup) {
    if (f.followup === "sem" && l.followUpStatus !== "nenhum") return false;
    if (f.followup !== "sem" && l.followUpStatus !== f.followup) return false;
  }
  if (f.semResponsavel === "1" && l.responsavel) return false;
  if (f.ganhos === "1" && l.status !== "convertido") return false;
  if (f.perdidos === "1" && l.status !== "perdido") return false;
  if (f.semInteracao) {
    const n = Number(f.semInteracao);
    if (!Number.isNaN(n)) {
      if (l.diasSemInteracao == null) {
        if (l.diasDesdeCriacao < n) return false;
      } else if (l.diasSemInteracao < n) return false;
    }
  }
  if (f.criados) {
    const limite = f.criados === "hoje" ? 0 : 7;
    if (l.diasDesdeCriacao > limite) return false;
  }
  if (f.modificados && l.atualizadoEmMs != null) {
    const dias = Math.floor((now - l.atualizadoEmMs) / DIA);
    const limite = f.modificados === "hoje" ? 0 : 7;
    if (dias > limite) return false;
  } else if (f.modificados && l.atualizadoEmMs == null) {
    return false;
  }
  if (f.valorMin) {
    const v = l.valorEstimado ? Number(l.valorEstimado) : 0;
    if (v < Number(f.valorMin)) return false;
  }
  if (f.valorMax) {
    const v = l.valorEstimado ? Number(l.valorEstimado) : 0;
    if (v > Number(f.valorMax)) return false;
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    const hay = [l.nome, l.empresa, l.pessoaContato, l.email, l.telefone, l.whatsapp, l.tags]
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// ── Métricas do Command Center ───────────────────────────────────────────────
export type LeadsMetrics = ReturnType<typeof computeMetrics>;

export function computeMetrics(todos: LeadDTO[], ativs: LeadAtividade[], now: number) {
  const inicioHoje = startOfDay(new Date(now)).getTime();
  const inicioOntem = inicioHoje - DIA;
  const inicioMes = new Date(new Date(now).getFullYear(), new Date(now).getMonth(), 1).getTime();
  const inicioMesPassado = new Date(new Date(now).getFullYear(), new Date(now).getMonth() - 1, 1).getTime();

  const ativos = todos.filter((l) => l.status !== "convertido" && l.status !== "perdido");
  const leadsAtivos = ativos.length;

  const criadosHoje = todos.filter((l) => l.criadoEmMs >= inicioHoje).length;
  const criadosOntem = todos.filter((l) => l.criadoEmMs >= inicioOntem && l.criadoEmMs < inicioHoje).length;

  const followupsHoje = todos.filter((l) => l.followUpStatus === "hoje").length;
  const followupsAtrasados = todos.filter((l) => l.followUpStatus === "atrasado").length;

  // Buckets operacionais: sem interação há N dias (entre ativos).
  const bucketsSemInteracao = [1, 3, 5, 7, 15, 30].map((d) => ({
    dias: d,
    total: ativos.filter((l) => (l.diasSemInteracao ?? l.diasDesdeCriacao) >= d).length,
  }));

  // Conversão do mês: convertidos / (convertidos + perdidos) fechados no mês.
  const fechadosMes = (status: LeadStatus, ini: number, fim: number) =>
    todos.filter(
      (l) => l.status === status && (l.atualizadoEmMs ?? l.criadoEmMs) >= ini && (l.atualizadoEmMs ?? l.criadoEmMs) < fim,
    ).length;
  const finMes = now + DIA * 400; // futuro distante
  const ganhosMes = fechadosMes("convertido", inicioMes, finMes);
  const perdidosMes = fechadosMes("perdido", inicioMes, finMes);
  const conversaoMes = ganhosMes + perdidosMes > 0 ? (ganhosMes / (ganhosMes + perdidosMes)) * 100 : 0;
  const ganhosMesPassado = fechadosMes("convertido", inicioMesPassado, inicioMes);
  const perdidosMesPassado = fechadosMes("perdido", inicioMesPassado, inicioMes);
  const conversaoMesPassado =
    ganhosMesPassado + perdidosMesPassado > 0
      ? (ganhosMesPassado / (ganhosMesPassado + perdidosMesPassado)) * 100
      : 0;

  // Receita prevista / ticket médio (leads ativos com valor estimado).
  const comValor = ativos.filter((l) => l.valorEstimado != null && Number(l.valorEstimado) > 0);
  const receitaPrevista = comValor.reduce((s, l) => s + Number(l.valorEstimado), 0);
  const ticketMedio = comValor.length > 0 ? receitaPrevista / comValor.length : 0;

  // Tempo médio parado (ativos) e tempo médio até fechamento (convertidos).
  const tempoMedioParado =
    ativos.length > 0 ? ativos.reduce((s, l) => s + l.diasParado, 0) / ativos.length : 0;
  const convertidos = todos.filter((l) => l.status === "convertido");
  const tempoMedioFechamento =
    convertidos.length > 0
      ? convertidos.reduce((s, l) => {
          const fim = l.atualizadoEmMs ?? l.criadoEmMs;
          return s + Math.max(0, Math.floor((fim - l.criadoEmMs) / DIA));
        }, 0) / convertidos.length
      : 0;

  // Funil por etapa (contagem + valor).
  const funil = LEAD_STAGES.map((s) => {
    const doStage = todos.filter((l) => l.status === s.key);
    return {
      key: s.key,
      label: s.label,
      total: doStage.length,
      valor: doStage.reduce((acc, l) => acc + (l.valorEstimado ? Number(l.valorEstimado) : 0), 0),
    };
  });

  // Conversão por origem e por responsável.
  const porChave = (getKey: (l: LeadDTO) => string) => {
    const map = new Map<string, { total: number; ganhos: number; perdidos: number }>();
    for (const l of todos) {
      const k = getKey(l) || "—";
      const e = map.get(k) ?? { total: 0, ganhos: 0, perdidos: 0 };
      e.total++;
      if (l.status === "convertido") e.ganhos++;
      if (l.status === "perdido") e.perdidos++;
      map.set(k, e);
    }
    return [...map.entries()].map(([chave, v]) => ({
      chave,
      ...v,
      conversao: v.ganhos + v.perdidos > 0 ? (v.ganhos / (v.ganhos + v.perdidos)) * 100 : 0,
    }));
  };
  const conversaoPorOrigem = porChave((l) => l.origem);
  const conversaoPorResponsavel = porChave((l) => l.responsavel);

  // Contagem de atividades por tipo (métricas de prospecção).
  const porTipo = new Map<string, number>();
  for (const a of ativs) porTipo.set(a.tipo, (porTipo.get(a.tipo) ?? 0) + 1);
  const atividadesPorTipo = {
    ligacao: porTipo.get("ligacao") ?? 0,
    whatsapp: porTipo.get("whatsapp") ?? 0,
    email: porTipo.get("email") ?? 0,
    reuniao: porTipo.get("reuniao") ?? 0,
    proposta: porTipo.get("proposta") ?? 0,
    visita: porTipo.get("visita") ?? 0,
    mensagem: porTipo.get("mensagem") ?? 0,
  };

  const leadsGanhos = todos.filter((l) => l.status === "convertido").length;
  const leadsPerdidos = todos.filter((l) => l.status === "perdido").length;

  // ── Atividade de prospecção (o foco do Sales OS) ───────────────────────────
  const ATENDIDAS = new Set(["gatekeeper", "sem_interesse", "interesse", "reuniao", "atendeu", "respondido"]);
  const DECISOR = new Set(["sem_interesse", "interesse", "reuniao"]);
  const hoje = (a: LeadAtividade) => a.criadoEm.getTime() >= inicioHoje;
  const leadCriadoEm = new Map(todos.map((l) => [l.id, l.criadoEmMs]));

  const ligacoes = ativs.filter((a) => a.tipo === "ligacao");
  const ligAtendidas = ligacoes.filter((a) => ATENDIDAS.has(a.resultado));
  const ligDecisor = ligacoes.filter((a) => DECISOR.has(a.resultado));
  const reunioesAtivs = ativs.filter((a) => a.tipo === "reuniao" || a.resultado === "reuniao");
  const wpps = ativs.filter((a) => a.tipo === "whatsapp");
  const wppsResp = wpps.filter((a) => a.resultado === "respondido");
  const followupsAtivs = ativs.filter((a) => a.tipo === "followup");

  const cnt = (arr: LeadAtividade[]) => arr.length;
  const cntHoje = (arr: LeadAtividade[]) => arr.filter(hoje).length;
  const taxa = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

  const mediaDiasReuniao = (() => {
    const ds = reunioesAtivs
      .map((a) => {
        const criado = leadCriadoEm.get(a.leadId);
        return criado ? Math.max(0, Math.floor((a.criadoEm.getTime() - criado) / DIA)) : null;
      })
      .filter((v): v is number => v != null);
    return ds.length > 0 ? ds.reduce((s, v) => s + v, 0) / ds.length : 0;
  })();

  const atividade = {
    hoje: {
      ligacoes: cntHoje(ligacoes),
      atendidas: cntHoje(ligAtendidas),
      decisores: cntHoje(ligDecisor),
      reunioes: cntHoje(reunioesAtivs),
      whatsapps: cntHoje(wpps),
      whatsappsRespondidos: cntHoje(wppsResp),
      followupsCriados: cntHoje(followupsAtivs),
      followupsConcluidos: cntHoje(ligacoes) + cntHoje(wpps),
    },
    total: {
      ligacoes: cnt(ligacoes),
      atendidas: cnt(ligAtendidas),
      decisores: cnt(ligDecisor),
      reunioes: cnt(reunioesAtivs),
      whatsapps: cnt(wpps),
      whatsappsRespondidos: cnt(wppsResp),
      followupsCriados: cnt(followupsAtivs),
    },
    taxaAtendimento: taxa(ligAtendidas.length, ligacoes.length),
    taxaDecisor: taxa(ligDecisor.length, ligAtendidas.length),
    taxaReuniao: taxa(reunioesAtivs.length, ligDecisor.length),
    mediaTentativasAtendimento: ligAtendidas.length > 0 ? ligacoes.length / ligAtendidas.length : 0,
    mediaTentativasReuniao: reunioesAtivs.length > 0 ? ligacoes.length / reunioesAtivs.length : 0,
    mediaDiasReuniao,
  };

  const semInteracao = ativos.filter((l) => (l.diasSemInteracao ?? l.diasDesdeCriacao) >= 3).length;

  return {
    leadsAtivos,
    criadosHoje,
    criadosOntem,
    followupsHoje,
    followupsAtrasados,
    semInteracao,
    bucketsSemInteracao,
    conversaoMes,
    conversaoMesPassado,
    ganhosMes,
    perdidosMes,
    receitaPrevista,
    ticketMedio,
    tempoMedioParado,
    tempoMedioFechamento,
    funil,
    conversaoPorOrigem,
    conversaoPorResponsavel,
    atividadesPorTipo,
    atividade,
    leadsGanhos,
    leadsPerdidos,
  };
}

// ── "Minha fila" (produtividade do dia) ──────────────────────────────────────
export type FilaItem = { leadId: number; titulo: string; sub: string };

function computeFila(todos: LeadDTO[], ativs: LeadAtividade[], now: number) {
  const inicioHoje = startOfDay(new Date(now)).getTime();
  const fimHoje = inicioHoje + DIA;
  const ativos = todos.filter((l) => l.status !== "convertido" && l.status !== "perdido");
  const titulo = (l: LeadDTO) => l.empresa || l.nome;

  const followupHoje: FilaItem[] = ativos
    .filter((l) => l.followUpStatus === "hoje")
    .map((l) => ({ leadId: l.id, titulo: titulo(l), sub: l.proximaAcao || "Follow-up hoje" }));

  const followupAtrasado: FilaItem[] = ativos
    .filter((l) => l.followUpStatus === "atrasado")
    .map((l) => ({ leadId: l.id, titulo: titulo(l), sub: l.proximaAcao || "Follow-up atrasado" }));

  // Tarefas abertas vencendo até hoje.
  const leadPorId = new Map(todos.map((l) => [l.id, l]));
  const tarefasPendentes: FilaItem[] = ativs
    .filter((a) => a.tipo === "tarefa" && !a.feito && a.data && a.data.getTime() < fimHoje)
    .map((a) => {
      const l = leadPorId.get(a.leadId);
      return { leadId: a.leadId, titulo: l ? titulo(l) : "Lead", sub: a.texto };
    });

  const semInteracao7d: FilaItem[] = ativos
    .filter((l) => (l.diasSemInteracao ?? l.diasDesdeCriacao) >= 7)
    .map((l) => ({ leadId: l.id, titulo: titulo(l), sub: `Sem contato há ${l.diasSemInteracao ?? l.diasDesdeCriacao} dias` }));

  const novosSemContato: FilaItem[] = ativos
    .filter((l) => l.status === "novo" && l.numInteracoes === 0)
    .map((l) => ({ leadId: l.id, titulo: titulo(l), sub: "Primeiro contato pendente" }));

  const propostasParaEnviar: FilaItem[] = ativos
    .filter((l) => l.status === "proposta")
    .map((l) => ({ leadId: l.id, titulo: titulo(l), sub: "Em proposta" }));

  return { followupHoje, followupAtrasado, tarefasPendentes, semInteracao7d, novosSemContato, propostasParaEnviar };
}

export type FilaData = ReturnType<typeof computeFila>;

// ── Orquestrador ─────────────────────────────────────────────────────────────
export type MetasDiarias = {
  ligacoes: number;
  atendidas: number;
  decisores: number;
  reunioes: number;
  whatsapps: number;
  followups: number;
};

const METAS_DEFAULT: MetasDiarias = {
  ligacoes: 60,
  atendidas: 20,
  decisores: 12,
  reunioes: 5,
  whatsapps: 15,
  followups: 10,
};

export type LeadsData = {
  leads: LeadDTO[];
  todos: LeadDTO[];
  atividadesPorLead: Record<number, AtividadeDTO[]>;
  checklistPorLead: Record<number, ChecklistDTO[]>;
  arquivosPorLead: Record<number, ArquivoDTO[]>;
  filtrosSalvos: FiltroSalvoDTO[];
  metrics: LeadsMetrics;
  fila: FilaData;
  filtros: LeadFilters;
  metas: MetasDiarias;
};

export async function getLeadsData(
  sp: Record<string, string | undefined>,
  autor?: string,
  // Escopo de gestão de equipe: null/undefined = sem restrição (Diretor/Dono
  // vendo "Todos"); um id = só os leads daquele usuário (força pra Vendedor,
  // ou seleção explícita de vendedor por quem pode ver a equipe). A decisão
  // de QUEM recebe qual escopo é do caller (a página, via getSessaoAtual) —
  // esta função só executa o filtro, nunca decide permissão.
  escopoUsuarioId?: number | null,
): Promise<LeadsData> {
  const db = getDb();
  const now = Date.now();
  const filtros = parseFilters(sp);

  const condicaoLeads =
    escopoUsuarioId != null
      ? and(eq(leads.arquivado, false), eq(leads.usuarioId, escopoUsuarioId))
      : eq(leads.arquivado, false);

  const rows = await db.select().from(leads).where(condicaoLeads).orderBy(desc(leads.criadoEm));
  const leadIds = rows.map((r) => r.id);
  const ativs = leadIds.length
    ? await db
        .select()
        .from(leadAtividades)
        .where(inArray(leadAtividades.leadId, leadIds))
        .orderBy(desc(leadAtividades.criadoEm))
    : [];

  // Tabelas novas: resilientes caso a migration ainda não tenha rodado.
  let checklistRows: (typeof leadChecklist.$inferSelect)[] = [];
  let arquivosRows: (typeof leadArquivos.$inferSelect)[] = [];
  let filtrosRows: (typeof leadFiltrosSalvos.$inferSelect)[] = [];
  let metas: MetasDiarias = { ...METAS_DEFAULT };
  try {
    [checklistRows, arquivosRows, filtrosRows] = await Promise.all([
      db.select().from(leadChecklist).orderBy(leadChecklist.ordem),
      db.select().from(leadArquivos).orderBy(desc(leadArquivos.criadoEm)),
      db.select().from(leadFiltrosSalvos).orderBy(desc(leadFiltrosSalvos.criadoEm)),
    ]);
    if (autor) {
      const mRows = await db.select().from(metasProspeccao).where(eq(metasProspeccao.autor, autor));
      const m = mRows[0];
      if (m) metas = { ligacoes: m.ligacoes, atendidas: m.atendidas, decisores: m.decisores, reunioes: m.reunioes, whatsapps: m.whatsapps, followups: m.followups };
    }
  } catch {
    // migration pendente — segue sem esses recursos
  }

  const ativsPorLead = new Map<number, LeadAtividade[]>();
  for (const a of ativs) {
    const arr = ativsPorLead.get(a.leadId) ?? [];
    arr.push(a);
    ativsPorLead.set(a.leadId, arr);
  }

  const todos = rows.map((l) => enrichLead(l, ativsPorLead.get(l.id) ?? [], now));
  const visiveis = todos.filter((l) => passaFiltro(l, filtros, now));

  const atividadesPorLead: Record<number, AtividadeDTO[]> = {};
  for (const a of ativs) (atividadesPorLead[a.leadId] ??= []).push(atividadeToDTO(a));

  const checklistPorLead: Record<number, ChecklistDTO[]> = {};
  for (const c of checklistRows) {
    (checklistPorLead[c.leadId] ??= []).push({ id: c.id, texto: c.texto, feito: c.feito, ordem: c.ordem });
  }

  const arquivosPorLead: Record<number, ArquivoDTO[]> = {};
  for (const a of arquivosRows) {
    (arquivosPorLead[a.leadId] ??= []).push({
      id: a.id,
      nome: a.nome,
      url: a.url,
      tamanhoLabel: tamanhoLabel(a.tamanho),
      autor: a.autor,
      criadoEmLabel: dtBR(a.criadoEm),
    });
  }

  const filtrosSalvos: FiltroSalvoDTO[] = filtrosRows.map((f) => ({
    id: f.id,
    nome: f.nome,
    autor: f.autor,
    filtro: f.filtro,
  }));

  return {
    leads: visiveis,
    todos,
    atividadesPorLead,
    checklistPorLead,
    arquivosPorLead,
    filtrosSalvos,
    metrics: computeMetrics(todos, ativs, now),
    fila: computeFila(todos, ativs, now),
    filtros,
    metas,
  };
}

export { num };
