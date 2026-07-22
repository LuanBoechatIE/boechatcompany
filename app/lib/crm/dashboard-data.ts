import { getDb } from "@/app/lib/db";
import {
  crmClientes,
  contratos,
  pagamentos,
  despesas,
  projetos,
  demandas,
  leads,
  clientes as onboardingClientes,
} from "@/app/lib/db/schema";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function last12MonthKeys(): { key: string; label: string; start: Date; end: Date }[] {
  const out: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    out.push({ key: monthKey(start), label: monthLabel(start), start, end });
  }
  return out;
}

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(periodo: { start: Date; end: Date }) {
  const db = getDb();
  const now = new Date();
  const { start: periodoInicio, end: periodoFim } = periodo;
  const em30dias = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const em7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    contratosRows,
    pagamentosRows,
    despesasRows,
    clientesRows,
    projetosRows,
    demandasRows,
    leadsRows,
    onboardingRows,
  ] = await Promise.all([
    db.select().from(contratos),
    db.select().from(pagamentos),
    db.select().from(despesas),
    db.select().from(crmClientes),
    db.select().from(projetos),
    db.select().from(demandas),
    db.select().from(leads),
    db.select().from(onboardingClientes),
  ]);

  const clienteNome = new Map(clientesRows.map((c) => [c.id, c.nome]));
  const contratoServico = new Map(contratosRows.map((c) => [c.id, c.servico]));

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const contratosAtivos = contratosRows.filter((c) => c.status === "ativo");
  const clientesAtivosIds = new Set(contratosAtivos.map((c) => c.clienteId));
  const clientesAtivos = clientesAtivosIds.size;

  const mrr = contratosAtivos.reduce((s, c) => s + num(c.valorRecorrente), 0);

  // KPIs "de fluxo" respeitam o período selecionado no filtro.
  const pagamentosDoPeriodo = pagamentosRows.filter(
    (p) => p.status === "pago" && p.pagoEm && p.pagoEm >= periodoInicio && p.pagoEm < periodoFim,
  );
  const receitaTotalMes = pagamentosDoPeriodo.reduce((s, p) => s + num(p.valor), 0);
  const receitaImplementacoesMes = pagamentosDoPeriodo
    .filter((p) => p.tipo === "implementacao")
    .reduce((s, p) => s + num(p.valor), 0);

  const despesasDoPeriodo = despesasRows
    .filter((d) => d.data >= periodoInicio && d.data < periodoFim)
    .reduce((s, d) => s + num(d.valor), 0);
  const lucroMes = receitaTotalMes - despesasDoPeriodo;

  const contratosEncerradosPeriodo = contratosRows.filter(
    (c) => c.status === "encerrado" && c.criadoEm >= periodoInicio && c.criadoEm < periodoFim,
  ).length;
  const ativosInicioPeriodo = contratosRows.filter((c) => c.dataInicio < periodoInicio).length;
  const churnPct =
    ativosInicioPeriodo > 0 ? (contratosEncerradosPeriodo / ativosInicioPeriodo) * 100 : 0;

  const valorTotalAtivo = contratosAtivos.reduce(
    (s, c) => s + num(c.valorImplementacao) + num(c.valorRecorrente),
    0,
  );
  const ticketMedio = clientesAtivos > 0 ? valorTotalAtivo / clientesAtivos : 0;

  const pendentesProx30 = pagamentosRows
    .filter((p) => p.status !== "pago" && p.vencimento >= now && p.vencimento <= em30dias)
    .reduce((s, p) => s + num(p.valor), 0);
  const receitaPrevista30d = pendentesProx30 + mrr;

  // ── Séries mensais (12 meses) pra gráficos + sparklines ─────────────────────
  const meses = last12MonthKeys();
  const receitaPorMes = meses.map(({ label, start, end }) => {
    const pagos = pagamentosRows.filter(
      (p) => p.status === "pago" && p.pagoEm && p.pagoEm >= start && p.pagoEm < end,
    );
    const recorrente = pagos.filter((p) => p.tipo === "recorrente").reduce((s, p) => s + num(p.valor), 0);
    const implementacao = pagos.filter((p) => p.tipo === "implementacao").reduce((s, p) => s + num(p.valor), 0);
    const despesa = despesasRows
      .filter((d) => d.data >= start && d.data < end)
      .reduce((s, d) => s + num(d.valor), 0);
    return { mes: label, total: recorrente + implementacao, recorrente, implementacao, lucro: recorrente + implementacao - despesa };
  });

  const clientesAtivosPorMes = meses.map(({ end }) => {
    const ids = new Set(
      contratosRows
        .filter((c) => c.dataInicio < end && (c.status !== "encerrado" || c.criadoEm >= end))
        .map((c) => c.clienteId),
    );
    return ids.size;
  });

  const receitaPorServico = (() => {
    const map = new Map<string, number>();
    for (const c of contratosAtivos) {
      const v = num(c.valorImplementacao) + num(c.valorRecorrente);
      if (v <= 0) continue;
      map.set(c.servico, (map.get(c.servico) ?? 0) + v);
    }
    return [...map.entries()].map(([servico, valor]) => ({ servico, valor }));
  })();

  // ── Resumo operacional ───────────────────────────────────────────────────
  const projetosAtivos = projetosRows.filter((p) => p.status !== "concluido").length;
  const demandasAbertas = demandasRows.filter((d) => d.status !== "concluido").length;
  const onboardingsPendentes = onboardingRows.filter((c) => c.status !== "respondido").length;
  const leadsAtivos = leadsRows.filter((l) => l.status !== "ganho" && l.status !== "perdido").length;

  // ── Alertas ───────────────────────────────────────────────────────────────
  const pagamentosAtrasados = pagamentosRows
    .filter((p) => p.status === "atrasado" || (p.status === "pendente" && p.vencimento < now))
    .map((p) => ({
      id: p.id,
      titulo: `${clienteNome.get(p.clienteId) ?? "Cliente"} · ${contratoServico.get(p.contratoId) ?? ""}`,
      valor: num(p.valor),
      vencimento: p.vencimento,
    }));

  const projetosEmAtraso = projetosRows
    .filter((p) => p.status !== "concluido" && p.prazo && p.prazo < now)
    .map((p) => ({ id: p.id, titulo: p.nome, vencimento: p.prazo as Date }));

  const clientesEmRisco = contratosRows
    .filter((c) => c.status === "pausado")
    .map((c) => ({
      id: c.id,
      titulo: `${clienteNome.get(c.clienteId) ?? "Cliente"} · ${c.servico}`,
    }));

  const contratosProximoVencimento = pagamentosRows
    .filter((p) => p.status !== "pago" && p.vencimento >= now && p.vencimento <= em7dias)
    .map((p) => ({
      id: p.id,
      titulo: `${clienteNome.get(p.clienteId) ?? "Cliente"} · ${contratoServico.get(p.contratoId) ?? ""}`,
      valor: num(p.valor),
      vencimento: p.vencimento,
    }));

  const onboardingsPendentesLista = onboardingRows
    .filter((c) => c.status !== "respondido")
    .map((c) => ({ id: c.id, titulo: c.nome }));

  // ── Atividade recente ─────────────────────────────────────────────────────
  type Evento = { tipo: string; titulo: string; quando: Date };
  const eventos: Evento[] = [
    ...clientesRows.map((c) => ({ tipo: "cliente", titulo: `Novo cliente: ${c.nome}`, quando: c.criadoEm })),
    ...contratosRows.map((c) => ({
      tipo: "contrato",
      titulo: `Contrato assinado: ${clienteNome.get(c.clienteId) ?? "Cliente"} · ${c.servico}`,
      quando: c.criadoEm,
    })),
    ...pagamentosRows
      .filter((p) => p.status === "pago" && p.pagoEm)
      .map((p) => ({
        tipo: "pagamento",
        titulo: `Pagamento recebido: ${clienteNome.get(p.clienteId) ?? "Cliente"} · R$ ${num(p.valor).toLocaleString("pt-BR")}`,
        quando: p.pagoEm as Date,
      })),
    ...projetosRows.map((p) => ({ tipo: "projeto", titulo: `Projeto criado: ${p.nome}`, quando: p.criadoEm })),
    ...demandasRows
      .filter((d) => d.status === "concluido")
      .map((d) => ({
        tipo: "demanda",
        titulo: `Demanda concluída: ${d.titulo}`,
        quando: d.atualizadoEm ?? d.criadoEm,
      })),
  ];
  eventos.sort((a, b) => b.quando.getTime() - a.quando.getTime());
  const atividadeRecente = eventos.slice(0, 8);

  return {
    kpis: {
      receitaTotalMes,
      mrr,
      receitaImplementacoesMes,
      clientesAtivos,
      churnPct,
      lucroMes,
      ticketMedio,
      receitaPrevista30d,
    },
    sparklines: {
      receitaTotalMes: receitaPorMes.slice(-6).map((m) => m.total),
      mrr: receitaPorMes.slice(-6).map((m) => m.recorrente),
      receitaImplementacoesMes: receitaPorMes.slice(-6).map((m) => m.implementacao),
      clientesAtivos: clientesAtivosPorMes.slice(-6),
      lucroMes: receitaPorMes.slice(-6).map((m) => m.lucro),
    },
    charts: {
      evolucaoReceita: receitaPorMes.map((m) => ({ mes: m.mes, total: m.total })),
      recorrenteVsImplementacao: receitaPorMes.map((m) => ({
        mes: m.mes,
        recorrente: m.recorrente,
        implementacao: m.implementacao,
      })),
      receitaPorServico,
    },
    operacao: { projetosAtivos, demandasAbertas, onboardingsPendentes, leadsAtivos },
    alertas: {
      pagamentosAtrasados,
      projetosEmAtraso,
      clientesEmRisco,
      contratosProximoVencimento,
      onboardingsPendentes: onboardingsPendentesLista,
    },
    atividadeRecente,
  };
}
