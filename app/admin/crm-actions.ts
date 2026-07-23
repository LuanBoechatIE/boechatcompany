"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  leads,
  leadAtividades,
  leadChecklist,
  leadArquivos,
  leadFiltrosSalvos,
  crmClientes,
  projetos,
  tarefas,
  demandas,
  estrategiaItems,
  mapasMentais,
} from "@/app/lib/db/schema";
import { LEAD_STAGES, isInteracao, ACAO_LABEL } from "@/app/lib/crm/types";
import { computeLeadScore } from "@/app/lib/crm/lead-score";
import { proximoPasso, agendarEscolha, quandoLabel } from "@/app/lib/crm/lead-engine";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import type {
  LeadStatus,
  AcaoTipo,
  ResultadoAtendimento,
  TarefaStatus,
  DemandaStatus,
  LeadImportRow,
  EstrategiaDuplicado,
  DuplicadoInfo,
  ImportResumo,
} from "@/app/lib/crm/types";

const stageLabel = (key: string) =>
  LEAD_STAGES.find((s) => s.key === key)?.label ?? key;

// ── Leads (pipeline comercial) ───────────────────────────────────────────────

function valorNum(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "") // tira separador de milhar
    .replace(",", ".")
    .trim();
  if (!s) return null;
  const n = Number(s);
  return isNaN(n) ? null : n.toFixed(2);
}

// Usuário logado (pra auditoria "quem alterou"). Nunca lança.
async function currentAutor(): Promise<string> {
  try {
    const c = await cookies();
    return (await verifySession(c.get(SESSION_COOKIE)?.value)) ?? "";
  } catch {
    return "";
  }
}

async function registrarAtividade(
  leadId: number,
  tipo: string,
  texto: string,
  autor = "",
) {
  await getDb().insert(leadAtividades).values({ leadId, tipo, texto, autor });
}

// Labels dos campos auditáveis do lead.
const CAMPO_LABEL: Record<string, string> = {
  nome: "Nome",
  empresa: "Empresa",
  pessoaContato: "Pessoa de contato",
  telefone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  servico: "Serviço",
  responsavel: "Responsável",
  origem: "Origem",
  valorEstimado: "Valor estimado",
  proximaAcao: "Próxima ação",
  proximoContato: "Próximo contato",
  prioridade: "Prioridade",
  tags: "Tags",
  observacoes: "Observações",
  status: "Etapa",
};

// Registra uma alteração de campo na timeline (tipo=auditoria) com o diff.
async function registrarAuditoria(
  leadId: number,
  campo: string,
  anterior: string | null,
  novo: string | null,
  autor: string,
) {
  const a = anterior ?? "";
  const n = novo ?? "";
  if (a === n) return;
  await getDb().insert(leadAtividades).values({
    leadId,
    tipo: "auditoria",
    texto: `${CAMPO_LABEL[campo] ?? campo} alterado`,
    campo,
    valorAnterior: a,
    valorNovo: n,
    autor,
  });
}

// Recalcula e persiste o lead_score. Respeita override manual (scoreFixo).
async function recalcLeadScore(leadId: number) {
  const db = getDb();
  const rows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  const lead = rows[0];
  if (!lead || lead.scoreFixo != null) return;
  const ativs = await db
    .select()
    .from(leadAtividades)
    .where(eq(leadAtividades.leadId, leadId));
  const interacoes = ativs.filter((a) => isInteracao(a.tipo));
  const ultima = interacoes.reduce<Date | null>(
    (max, a) => (!max || a.criadoEm > max ? a.criadoEm : max),
    null,
  );
  const score = computeLeadScore({
    status: lead.status as LeadStatus,
    valorEstimado: lead.valorEstimado != null ? Number(lead.valorEstimado) : null,
    ultimaInteracaoEm: lead.ultimaInteracaoEm ?? ultima,
    numInteracoes: interacoes.length,
  });
  await db.update(leads).set({ leadScore: score }).where(eq(leads.id, leadId));
}

export async function createLead(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const autor = await currentAutor();
  const rows = await getDb()
    .insert(leads)
    .values({
      nome,
      empresa: String(formData.get("empresa") ?? "").trim(),
      pessoaContato: String(formData.get("pessoaContato") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      telefone: String(formData.get("telefone") ?? "").trim(),
      whatsapp: String(formData.get("whatsapp") ?? "").trim(),
      servico: String(formData.get("servico") ?? "").trim(),
      responsavel: String(formData.get("responsavel") ?? "").trim(),
      origem: String(formData.get("origem") ?? "").trim() || "manual",
      valorEstimado: valorNum(formData.get("valorEstimado")),
      proximaAcao: String(formData.get("proximaAcao") ?? "").trim(),
      proximoContato: parsePrazo(formData.get("proximoContato")),
      prioridade: String(formData.get("prioridade") ?? "media").trim() || "media",
      tags: String(formData.get("tags") ?? "").trim(),
      observacoes: String(formData.get("observacoes") ?? "").trim(),
      status: "novo",
      atualizadoEm: new Date(),
    })
    .returning({ id: leads.id });
  const novoId = rows[0]?.id;
  if (novoId) {
    await registrarAtividade(novoId, "evento", "Lead criado", autor);
    await recalcLeadScore(novoId);
  }
  revalidatePath("/admin/crm/leads");
}

export async function updateLead(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = getDb();
  const autor = await currentAutor();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const antes = rows[0];
  if (!antes) return;

  const proximoContato = parsePrazo(formData.get("proximoContato"));
  const novos = {
    nome: String(formData.get("nome") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim(),
    pessoaContato: String(formData.get("pessoaContato") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telefone: String(formData.get("telefone") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    servico: String(formData.get("servico") ?? "").trim(),
    responsavel: String(formData.get("responsavel") ?? "").trim(),
    origem: String(formData.get("origem") ?? "").trim() || "manual",
    valorEstimado: valorNum(formData.get("valorEstimado")),
    proximaAcao: String(formData.get("proximaAcao") ?? "").trim(),
    proximoContato,
    prioridade: String(formData.get("prioridade") ?? antes.prioridade).trim() || "media",
    tags: String(formData.get("tags") ?? "").trim(),
    observacoes: String(formData.get("observacoes") ?? "").trim(),
  };

  await db.update(leads).set({ ...novos, atualizadoEm: new Date() }).where(eq(leads.id, id));

  // Auditoria: registra cada campo que mudou.
  const fmtData = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "";
  for (const k of Object.keys(novos) as (keyof typeof novos)[]) {
    if (k === "proximoContato") {
      await registrarAuditoria(id, k, fmtData(antes.proximoContato), fmtData(proximoContato), autor);
    } else {
      await registrarAuditoria(id, k, String(antes[k] ?? ""), String(novos[k] ?? ""), autor);
    }
  }
  await recalcLeadScore(id);
  revalidatePath("/admin/crm/leads");
}

// Client-callable: usado no drag & drop do Kanban.
export async function updateLeadStatus(id: number, status: LeadStatus) {
  if (!id || !status) return;
  const db = getDb();
  const autor = await currentAutor();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const antes = rows[0];
  if (!antes) return;
  const stageAntes = LEAD_STAGES.find((s) => s.key === antes.status)?.label ?? antes.status;
  const stage = LEAD_STAGES.find((s) => s.key === status)?.label ?? status;
  await db.update(leads).set({ status, atualizadoEm: new Date() }).where(eq(leads.id, id));
  await registrarAtividade(id, "evento", `Movido para ${stage}`, autor);
  await registrarAuditoria(id, "status", stageAntes, stage, autor);
  await recalcLeadScore(id);
  revalidatePath("/admin/crm/leads");
}

export async function markLeadLost(formData: FormData) {
  const id = Number(formData.get("id"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!id) return;
  const autor = await currentAutor();
  await getDb()
    .update(leads)
    .set({ status: "perdido", motivoPerda: motivo, atualizadoEm: new Date() })
    .where(eq(leads.id, id));
  await registrarAtividade(id, "evento", `Perdido${motivo ? `: ${motivo}` : ""}`, autor);
  await recalcLeadScore(id);
  revalidatePath("/admin/crm/leads");
}

export async function archiveLead(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().update(leads).set({ arquivado: true }).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

export async function deleteLead(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(leads).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

// Converte um lead em cliente de CRM preservando os dados comerciais e o
// histórico (as atividades continuam ligadas ao lead, que fica arquivado).
export async function convertLeadToClient(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const db = getDb();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const lead = rows[0];
  if (!lead) return;

  await db.insert(crmClientes).values({
    nome: lead.nome,
    empresa: lead.empresa,
    email: lead.email,
    whatsapp: lead.whatsapp || lead.telefone,
    leadId: lead.id,
  });
  await db
    .update(leads)
    .set({ status: "convertido", arquivado: true, atualizadoEm: new Date() })
    .where(eq(leads.id, id));
  await registrarAtividade(id, "evento", "Convertido em cliente", await currentAutor());
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm/clientes");
  redirect("/admin/crm/clientes");
}

// ── Atividades do lead (notas, tarefas, interações, histórico) ───────────────

export async function addAtividade(formData: FormData) {
  const leadId = Number(formData.get("leadId"));
  const texto = String(formData.get("texto") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "nota").trim() || "nota";
  if (!leadId || !texto) return;
  const autor =
    String(formData.get("autor") ?? "").trim() || (await currentAutor());
  const agora = new Date();
  await getDb().insert(leadAtividades).values({
    leadId,
    tipo,
    texto,
    data: parsePrazo(formData.get("data")),
    autor,
    criadoEm: agora,
  });
  // Interação real: atualiza última interação e recalcula score.
  const patch: { atualizadoEm: Date; ultimaInteracaoEm?: Date } = { atualizadoEm: agora };
  if (isInteracao(tipo)) patch.ultimaInteracaoEm = agora;
  await getDb().update(leads).set(patch).where(eq(leads.id, leadId));
  await recalcLeadScore(leadId);
  revalidatePath("/admin/crm/leads");
}

export async function toggleAtividade(formData: FormData) {
  const id = Number(formData.get("id"));
  const feito = String(formData.get("feito") ?? "") === "true";
  if (!id) return;
  await getDb()
    .update(leadAtividades)
    .set({ feito: !feito })
    .where(eq(leadAtividades.id, id));
  revalidatePath("/admin/crm/leads");
}

export async function deleteAtividade(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(leadAtividades).where(eq(leadAtividades.id, id));
  revalidatePath("/admin/crm/leads");
}

// ── Prioridade, score e follow-up ────────────────────────────────────────────

// Client-callable: usado nas ações rápidas do card/painel.
export async function setLeadPrioridade(id: number, prioridade: string) {
  if (!id || !prioridade) return;
  const db = getDb();
  const autor = await currentAutor();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const antes = rows[0];
  if (!antes) return;
  await db.update(leads).set({ prioridade, atualizadoEm: new Date() }).where(eq(leads.id, id));
  await registrarAuditoria(id, "prioridade", antes.prioridade, prioridade, autor);
  await recalcLeadScore(id);
  revalidatePath("/admin/crm/leads");
}

// Fixa (ou libera) o score manualmente. score negativo/NaN => volta pro automático.
export async function setLeadScoreFixo(id: number, score: number | null) {
  if (!id) return;
  const db = getDb();
  const valido = score != null && !Number.isNaN(score);
  await db
    .update(leads)
    .set({ scoreFixo: valido ? Math.max(0, Math.min(100, Math.round(score))) : null, atualizadoEm: new Date() })
    .where(eq(leads.id, id));
  if (!valido) await recalcLeadScore(id);
  else if (score != null) await db.update(leads).set({ leadScore: Math.max(0, Math.min(100, Math.round(score))) }).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

export async function updateFollowUp(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const autor = await currentAutor();
  const db = getDb();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const antes = rows[0];
  if (!antes) return;
  const proximoContato = parsePrazo(formData.get("proximoContato"));
  const proximaAcao = String(formData.get("proximaAcao") ?? "").trim();
  const responsavel = String(formData.get("proximoContatoResponsavel") ?? "").trim();
  await db
    .update(leads)
    .set({ proximoContato, proximaAcao, proximoContatoResponsavel: responsavel, atualizadoEm: new Date() })
    .where(eq(leads.id, id));
  const fmt = (d: Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : "");
  await registrarAuditoria(id, "proximoContato", fmt(antes.proximoContato), fmt(proximoContato), autor);
  revalidatePath("/admin/crm/leads");
}

// ── Motor de cadência: registra um atendimento e conduz a prospecção ─────────
// Client-callable. Registra a tentativa, avança a cadência, cria o follow-up
// automático e move a etapa — o vendedor só responde às perguntas do modal.
export async function registrarResultado(p: ResultadoAtendimento) {
  const id = p.leadId;
  if (!id) return;
  const db = getDb();
  const autor = await currentAutor();
  const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  const lead = rows[0];
  if (!lead) return;
  const agora = new Date();
  const override = p.agendarPara ? new Date(p.agendarPara) : null;

  // 1) Encerramento definitivo — só número inválido ou empresa fechou.
  if (p.encerrar) {
    const label = p.encerrar === "numero_invalido" ? "Número inválido" : "Empresa fechou";
    await db
      .update(leads)
      .set({
        status: "perdido",
        encerrado: true,
        motivoEncerramento: p.encerrar,
        motivoPerda: label,
        proximaAcaoTipo: "nenhuma",
        proximoContato: null,
        atualizadoEm: agora,
      })
      .where(eq(leads.id, id));
    await db.insert(leadAtividades).values({
      leadId: id, tipo: p.canal, canal: p.canal, resultado: "encerrado",
      texto: `Encerrado: ${label}`, autor, criadoEm: agora,
    });
    if (lead.status !== "perdido")
      await registrarAuditoria(id, "status", stageLabel(lead.status), "Perdido", autor);
    revalidatePath("/admin/crm/leads");
    return;
  }

  const tentativaN =
    (await db.select().from(leadAtividades).where(eq(leadAtividades.leadId, id))).filter(
      (a) => a.tipo === "ligacao" || a.tipo === "whatsapp" || a.canal === "ligacao" || a.canal === "whatsapp",
    ).length + 1;

  let resultado = "";
  let texto = "";
  let novoStatus: LeadStatus = lead.status as LeadStatus;
  let proximaAcaoTipo: AcaoTipo = "ligar";
  let proximaAcaoLabel = "";
  let proximoContato: Date | null = null;
  let cadenciaPasso = lead.cadenciaPasso;

  if (p.canal === "ligacao") {
    if (!p.atendeu) {
      resultado = "nao_atendeu";
      const prox = proximoPasso(lead.cadenciaPasso, agora);
      cadenciaPasso = prox.passo;
      proximaAcaoTipo = prox.tipo;
      proximaAcaoLabel = prox.label;
      proximoContato = override ?? prox.quando;
      texto = `Ligação — não atendeu (tentativa ${tentativaN}). Próxima: ${prox.label}`;
      if (lead.status === "novo") novoStatus = "primeiro_contato";
    } else if (!p.decisor) {
      resultado = "gatekeeper";
      texto = `Ligação — atendeu, mas não é o decisor`;
      if (p.gatekeeper && (p.gatekeeper.nome || p.gatekeeper.telefone)) {
        texto += `. Contato: ${[p.gatekeeper.nome, p.gatekeeper.cargo, p.gatekeeper.telefone]
          .filter(Boolean)
          .join(" · ")}${p.gatekeeper.horario ? ` — melhor horário ${p.gatekeeper.horario}` : ""}`;
      }
      const esc = agendarEscolha(p.proximaAcao ?? "outro_horario", agora);
      proximaAcaoTipo = esc.tipo;
      proximaAcaoLabel = esc.label;
      proximoContato = override ?? esc.quando;
      if (lead.status === "novo") novoStatus = "primeiro_contato";
    } else if (!p.interesse) {
      resultado = "sem_interesse";
      texto = `Ligação — decisor sem interesse${p.motivo ? `: ${p.motivo}` : ""}`;
      const esc = agendarEscolha(p.proximaAcao ?? "followup", agora);
      proximaAcaoTipo = esc.tipo;
      proximaAcaoLabel = esc.label;
      proximoContato = override ?? esc.quando;
      if (lead.status === "novo") novoStatus = "primeiro_contato";
      // Não move pra perdido: continua no funil.
    } else if (p.reuniaoMarcada && p.reuniao) {
      resultado = "reuniao";
      const dt = new Date(p.reuniao.dataHora);
      texto = `Reunião marcada (${p.reuniao.tipo}) para ${dt.toLocaleString("pt-BR")}`;
      novoStatus = "reuniao_agendada";
      proximaAcaoTipo = "reuniao";
      proximaAcaoLabel = `Reunião ${p.reuniao.tipo}`;
      proximoContato = dt;
      await db.insert(leadAtividades).values({
        leadId: id, tipo: "reuniao", canal: "ligacao", resultado: p.reuniao.tipo,
        texto, autor, data: dt, criadoEm: agora,
      });
    } else {
      resultado = "interesse";
      texto = `Ligação — decisor com interesse`;
      novoStatus = "qualificado";
      const esc = agendarEscolha(p.proximaAcao ?? "ligar", agora);
      proximaAcaoTipo = esc.tipo;
      proximaAcaoLabel = esc.label;
      proximoContato = override ?? esc.quando;
    }
  } else {
    // WhatsApp
    resultado = p.atendeu ? "respondido" : "enviado";
    texto = p.atendeu ? "WhatsApp respondido" : "WhatsApp enviado";
    const prox = proximoPasso(Math.max(lead.cadenciaPasso, 6), agora);
    cadenciaPasso = Math.max(lead.cadenciaPasso, 6);
    proximaAcaoTipo = "ligar";
    proximaAcaoLabel = "Ligar após o WhatsApp";
    proximoContato = override ?? prox.quando;
    if (lead.status === "novo") novoStatus = "primeiro_contato";
  }

  // Registra a tentativa principal.
  await db.insert(leadAtividades).values({
    leadId: id, tipo: p.canal, canal: p.canal, resultado, texto, autor, criadoEm: agora,
  });

  if (p.observacao) {
    await db.insert(leadAtividades).values({
      leadId: id, tipo: "nota", texto: p.observacao, autor, criadoEm: agora,
    });
  }

  // Log do follow-up criado (alimenta as métricas de atividade).
  if (proximoContato && proximaAcaoTipo !== "nenhuma") {
    await db.insert(leadAtividades).values({
      leadId: id, tipo: "followup", resultado: "criado",
      texto: `Follow-up: ${ACAO_LABEL[proximaAcaoTipo]} — ${quandoLabel(proximoContato, agora)}`,
      autor, data: proximoContato, criadoEm: agora,
    });
  }

  await db
    .update(leads)
    .set({
      status: novoStatus,
      cadenciaPasso,
      proximaAcaoTipo,
      proximaAcao: proximaAcaoLabel,
      proximoContato,
      ultimaInteracaoEm: agora,
      atualizadoEm: agora,
    })
    .where(eq(leads.id, id));

  if (novoStatus !== lead.status)
    await registrarAuditoria(id, "status", stageLabel(lead.status), stageLabel(novoStatus), autor);
  await recalcLeadScore(id);
  revalidatePath("/admin/crm/leads");
}

// ── Checklist do lead ────────────────────────────────────────────────────────

export async function addChecklistItem(formData: FormData) {
  const leadId = Number(formData.get("leadId"));
  const texto = String(formData.get("texto") ?? "").trim();
  if (!leadId || !texto) return;
  const db = getDb();
  const existentes = await db.select().from(leadChecklist).where(eq(leadChecklist.leadId, leadId));
  const ordem = existentes.reduce((m, c) => Math.max(m, c.ordem), 0) + 1;
  await db.insert(leadChecklist).values({ leadId, texto, ordem });
  revalidatePath("/admin/crm/leads");
}

export async function toggleChecklistItem(id: number, feito: boolean) {
  if (!id) return;
  await getDb().update(leadChecklist).set({ feito: !feito }).where(eq(leadChecklist.id, id));
  revalidatePath("/admin/crm/leads");
}

export async function deleteChecklistItem(id: number) {
  if (!id) return;
  await getDb().delete(leadChecklist).where(eq(leadChecklist.id, id));
  revalidatePath("/admin/crm/leads");
}

// ── Arquivos do lead (a URL já subiu pro Blob no client) ─────────────────────

export async function addLeadArquivo(
  leadId: number,
  nome: string,
  url: string,
  tamanho: number,
) {
  if (!leadId || !url) return;
  await getDb().insert(leadArquivos).values({
    leadId,
    nome,
    url,
    tamanho,
    autor: await currentAutor(),
  });
  revalidatePath("/admin/crm/leads");
}

export async function deleteLeadArquivo(id: number) {
  if (!id) return;
  await getDb().delete(leadArquivos).where(eq(leadArquivos.id, id));
  revalidatePath("/admin/crm/leads");
}

// ── Filtros salvos (favoritos do pipeline) ───────────────────────────────────

export async function saveFiltro(nome: string, filtro: Record<string, string>) {
  const n = nome.trim();
  if (!n) return;
  await getDb().insert(leadFiltrosSalvos).values({
    nome: n,
    autor: await currentAutor(),
    filtro,
  });
  revalidatePath("/admin/crm/leads");
}

export async function deleteFiltro(id: number) {
  if (!id) return;
  await getDb().delete(leadFiltrosSalvos).where(eq(leadFiltrosSalvos.id, id));
  revalidatePath("/admin/crm/leads");
}

// ── Importação de contatos ───────────────────────────────────────────────────

const soDigitos = (s: string) => (s ?? "").replace(/\D/g, "");
const lower = (s: string) => (s ?? "").trim().toLowerCase();

type LeadRow = typeof leads.$inferSelect;

// Retorna o lead existente que casa com a linha (por e-mail, telefone/whatsapp
// ou nome+empresa), ou null.
function acharDuplicado(
  existentes: LeadRow[],
  row: LeadImportRow,
): { leadId: number; nome: string; motivo: string } | null {
  const email = lower(row.email ?? "");
  const tel = soDigitos(row.telefone ?? "");
  const wpp = soDigitos(row.whatsapp ?? "");
  const nomeEmp = `${lower(row.nome ?? "")}|${lower(row.empresa ?? "")}`;

  for (const e of existentes) {
    if (email && lower(e.email) === email)
      return { leadId: e.id, nome: e.nome, motivo: "e-mail" };
    const eTels = [soDigitos(e.telefone), soDigitos(e.whatsapp)].filter(Boolean);
    if ((tel && eTels.includes(tel)) || (wpp && eTels.includes(wpp)))
      return { leadId: e.id, nome: e.nome, motivo: "telefone" };
    if (
      (row.nome || row.empresa) &&
      `${lower(e.nome)}|${lower(e.empresa)}` === nomeEmp
    )
      return { leadId: e.id, nome: e.nome, motivo: "nome + empresa" };
  }
  return null;
}

// Só checa duplicidades (read-only), pra mostrar no passo de revisão.
export async function checkLeadDuplicates(
  rows: LeadImportRow[],
): Promise<DuplicadoInfo[]> {
  const existentes = await getDb().select().from(leads);
  const out: DuplicadoInfo[] = [];
  rows.forEach((row, index) => {
    const dup = acharDuplicado(existentes, row);
    if (dup) out.push({ index, leadId: dup.leadId, nome: dup.nome, motivo: dup.motivo });
  });
  return out;
}

function valoresDaRow(row: LeadImportRow) {
  return {
    nome: (row.nome ?? "").trim(),
    empresa: (row.empresa ?? "").trim(),
    pessoaContato: (row.pessoaContato ?? "").trim(),
    telefone: (row.telefone ?? "").trim(),
    whatsapp: (row.whatsapp ?? "").trim(),
    email: (row.email ?? "").trim(),
    servico: (row.servico ?? "").trim(),
    origem: (row.origem ?? "").trim() || "importado",
    responsavel: (row.responsavel ?? "").trim(),
    tags: (row.tags ?? "").trim(),
    observacoes: (row.observacoes ?? "").trim(),
    valorEstimado: row.valorEstimado
      ? (() => {
          const fd = new FormData();
          fd.set("v", row.valorEstimado);
          return valorNum(fd.get("v"));
        })()
      : null,
  };
}

// Persiste os leads importados. Todos entram na etapa "novo".
export async function importLeads(
  rows: LeadImportRow[],
  estrategia: EstrategiaDuplicado,
): Promise<ImportResumo> {
  const db = getDb();
  const existentes = await db.select().from(leads);
  const resumo: ImportResumo = { importados: 0, atualizados: 0, ignorados: 0, erros: 0 };

  for (const row of rows) {
    const nome = (row.nome ?? "").trim();
    if (!nome) {
      resumo.erros++;
      continue;
    }
    try {
      const dup = acharDuplicado(existentes, row);
      const vals = valoresDaRow(row);

      if (dup) {
        if (estrategia === "ignorar") {
          resumo.ignorados++;
          continue;
        }
        if (estrategia === "atualizar") {
          // Só sobrescreve campos preenchidos na planilha.
          const patch = Object.fromEntries(
            Object.entries(vals).filter(([, v]) => v != null && v !== ""),
          );
          await db.update(leads).set(patch).where(eq(leads.id, dup.leadId));
          resumo.atualizados++;
          continue;
        }
      }

      const inserted = await db
        .insert(leads)
        .values({ ...vals, status: "novo" })
        .returning({ id: leads.id });
      // Mantém a lista de existentes atualizada pra dedup dentro do mesmo lote.
      if (inserted[0]) {
        existentes.push({
          ...(vals as LeadRow),
          id: inserted[0].id,
        } as LeadRow);
      }
      resumo.importados++;
    } catch {
      resumo.erros++;
    }
  }

  revalidatePath("/admin/crm/leads");
  return resumo;
}

// ── Clientes CRM ─────────────────────────────────────────────────────────────

export async function createCrmCliente(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  await getDb().insert(crmClientes).values({
    nome,
    empresa: String(formData.get("empresa") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
  });
  revalidatePath("/admin/crm/clientes");
  redirect("/admin/crm/clientes");
}

export async function updateCrmCliente(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  await getDb()
    .update(crmClientes)
    .set({
      nome: g("nome"),
      empresa: g("empresa"),
      email: g("email"),
      whatsapp: g("whatsapp"),
      telefone: g("telefone"),
      segmento: g("segmento"),
      endereco: g("endereco"),
      cidade: g("cidade"),
      estado: g("estado"),
      site: g("site"),
      instagram: g("instagram"),
      responsavelInterno: g("responsavelInterno"),
      statusCliente: g("statusCliente") || "ativo",
      observacoes: g("observacoes"),
      proximosPassos: g("proximosPassos"),
    })
    .where(eq(crmClientes.id, id));
  revalidatePath(`/admin/crm/clientes/${id}`);
  revalidatePath("/admin/crm/clientes");
}

export async function deleteCrmCliente(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(crmClientes).where(eq(crmClientes.id, id));
  revalidatePath("/admin/crm/clientes");
  redirect("/admin/crm/clientes");
}

// Salva (ou limpa) a URL da logo do cliente. A logo em si já subiu pro Blob;
// aqui só guardamos a referência.
export async function updateClienteLogo(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  const logo = String(formData.get("logo") ?? "").trim();
  await getDb().update(crmClientes).set({ logo }).where(eq(crmClientes.id, id));
  revalidatePath(`/admin/crm/clientes/${id}`);
}

// ── Projetos ─────────────────────────────────────────────────────────────────

export async function createProjeto(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const clienteIdRaw = Number(formData.get("clienteId"));
  await getDb().insert(projetos).values({
    nome,
    briefing: String(formData.get("briefing") ?? "").trim(),
    clienteId: clienteIdRaw > 0 ? clienteIdRaw : null,
    status: "planejamento",
  });
  revalidatePath("/admin/crm/projetos");
  redirect("/admin/crm/projetos");
}

export async function deleteProjeto(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(projetos).where(eq(projetos.id, id));
  revalidatePath("/admin/crm/projetos");
  redirect("/admin/crm/projetos");
}

// ── Tarefas (Kanban do projeto) ──────────────────────────────────────────────

function parsePrazo(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTarefa(formData: FormData) {
  const projetoId = Number(formData.get("projetoId"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!projetoId || !titulo) return;
  await getDb().insert(tarefas).values({
    projetoId,
    titulo,
    descricao: String(formData.get("descricao") ?? "").trim(),
    responsavel: String(formData.get("responsavel") ?? "").trim(),
    prioridade: String(formData.get("prioridade") ?? "media"),
    prazo: parsePrazo(formData.get("prazo")),
    status: "todo",
  });
  revalidatePath(`/admin/crm/projetos/${projetoId}`);
  revalidatePath("/admin/crm/calendario");
}

export async function updateTarefaStatus(id: number, status: TarefaStatus) {
  if (!id) return;
  await getDb().update(tarefas).set({ status }).where(eq(tarefas.id, id));
  revalidatePath("/admin/crm/projetos");
}

export async function deleteTarefa(formData: FormData) {
  const id = Number(formData.get("id"));
  const projetoId = Number(formData.get("projetoId"));
  if (!id) return;
  await getDb().delete(tarefas).where(eq(tarefas.id, id));
  if (projetoId) revalidatePath(`/admin/crm/projetos/${projetoId}`);
}

// ── Demandas (Kanban geral) ──────────────────────────────────────────────────

// Junta múltiplos responsáveis marcados numa string "Luan, Samuel".
function parseResponsaveis(formData: FormData): string {
  return formData
    .getAll("responsavel")
    .map((v) => String(v).trim())
    .filter(Boolean)
    .join(", ");
}

export async function createDemanda(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;
  const clienteIdRaw = Number(formData.get("clienteId"));
  await getDb().insert(demandas).values({
    titulo,
    descricao: String(formData.get("descricao") ?? "").trim(),
    responsavel: parseResponsaveis(formData),
    prioridade: String(formData.get("prioridade") ?? "media"),
    clienteId: clienteIdRaw > 0 ? clienteIdRaw : null,
    prazo: parsePrazo(formData.get("prazo")),
    status: "backlog",
  });
  revalidatePath("/admin/crm/demandas");
  revalidatePath("/admin/crm/calendario");
}

export async function updateDemandaStatus(id: number, status: DemandaStatus) {
  if (!id) return;
  await getDb()
    .update(demandas)
    .set({ status, atualizadoEm: new Date() })
    .where(eq(demandas.id, id));
  revalidatePath("/admin/crm/demandas");
  revalidatePath("/admin/crm");
}

export async function deleteDemanda(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(demandas).where(eq(demandas.id, id));
  revalidatePath("/admin/crm/demandas");
}

// ── Estratégia (itens por fase) ──────────────────────────────────────────────

export async function createEstrategiaItem(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const fase = String(formData.get("fase") ?? "").trim();
  if (!titulo || !fase) return;
  const clienteIdRaw = Number(formData.get("clienteId"));
  await getDb().insert(estrategiaItems).values({
    titulo,
    fase,
    descricao: String(formData.get("descricao") ?? "").trim(),
    responsavel: String(formData.get("responsavel") ?? "").trim(),
    prioridade: String(formData.get("prioridade") ?? "media"),
    clienteId: clienteIdRaw > 0 ? clienteIdRaw : null,
    status: "todo",
  });
  revalidatePath("/admin/crm/estrategia");
  if (clienteIdRaw > 0) revalidatePath(`/admin/crm/clientes/${clienteIdRaw}`);
}

export async function updateEstrategiaStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "").trim();
  if (!id || !status) return;
  await getDb()
    .update(estrategiaItems)
    .set({ status })
    .where(eq(estrategiaItems.id, id));
  revalidatePath("/admin/crm/estrategia");
  const clienteId = Number(formData.get("clienteId"));
  if (clienteId > 0) revalidatePath(`/admin/crm/clientes/${clienteId}`);
}

export async function deleteEstrategiaItem(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(estrategiaItems).where(eq(estrategiaItems.id, id));
  revalidatePath("/admin/crm/estrategia");
  const clienteId = Number(formData.get("clienteId"));
  if (clienteId > 0) revalidatePath(`/admin/crm/clientes/${clienteId}`);
}

// ── Mapas mentais ────────────────────────────────────────────────────────────

export async function createMapa(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim() || "Novo mapa";
  const rows = await getDb()
    .insert(mapasMentais)
    .values({ titulo, nodes: [], edges: [] })
    .returning({ id: mapasMentais.id });
  revalidatePath("/admin/crm/mapas");
  const novoId = rows[0]?.id;
  if (novoId) redirect(`/admin/crm/mapas/${novoId}`);
  redirect("/admin/crm/mapas");
}

export async function renameMapa(formData: FormData) {
  const id = Number(formData.get("id"));
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!id || !titulo) return;
  await getDb()
    .update(mapasMentais)
    .set({ titulo, atualizadoEm: new Date() })
    .where(eq(mapasMentais.id, id));
  revalidatePath(`/admin/crm/mapas/${id}`);
  revalidatePath("/admin/crm/mapas");
}

export async function updateMapaCanvas(
  id: number,
  nodes: unknown[],
  edges: unknown[],
) {
  if (!id) return;
  await getDb()
    .update(mapasMentais)
    .set({ nodes, edges, atualizadoEm: new Date() })
    .where(eq(mapasMentais.id, id));
  revalidatePath(`/admin/crm/mapas/${id}`);
}

export async function deleteMapa(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(mapasMentais).where(eq(mapasMentais.id, id));
  revalidatePath("/admin/crm/mapas");
  redirect("/admin/crm/mapas");
}
