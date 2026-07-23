"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { demandas, demandApprovals, usuarios, crmClientes } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { resolverPermissoes } from "@/app/lib/permissoes";

const PATH = "/admin/crm/demandas";
type Res = { ok: boolean; erro?: string };

type Ctx = {
  username: string;
  nome: string;
  superAdmin: boolean;
  perms: Set<string>;
};

async function ctx(): Promise<Ctx | null> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) return null;
  const u = (await getDb().select().from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  const { superAdmin, permissoes } = u
    ? await resolverPermissoes(u.id)
    : { superAdmin: false, permissoes: [] as string[] };
  return {
    username,
    nome: u?.nomeCompleto || username,
    superAdmin,
    perms: new Set(permissoes),
  };
}

function tem(c: Ctx, perm: string): boolean {
  return c.superAdmin || c.perms.has(perm);
}

// `responsavel` é texto livre: casa pelo username ou primeiro nome do usuário.
function ehResponsavel(c: Ctx, responsavel: string): boolean {
  const r = (responsavel ?? "").toLowerCase();
  if (!r) return false;
  const primeiro = c.nome.split(" ")[0]?.toLowerCase() ?? "";
  return r.includes(c.username.toLowerCase()) || (!!primeiro && r.includes(primeiro));
}

async function carregarDemanda(id: number) {
  return (await getDb().select().from(demandas).where(eq(demandas.id, id)).limit(1))[0] ?? null;
}

// ── Contexto pra UI: o que o usuário atual pode fazer ────────────────────────
export type AprovacaoPermsView = {
  username: string;
  superAdmin: boolean;
  pode: {
    concluirAny: boolean;
    concluirOwn: boolean;
    submeter: boolean;
    registrarCliente: boolean;
    aprovar: boolean;
    rejeitar: boolean;
    solicitarAlteracoes: boolean;
    cancelar: boolean;
    verHistorico: boolean;
  };
};

export async function getAprovacaoPerms(): Promise<AprovacaoPermsView> {
  const c = await ctx();
  const base = { username: "", superAdmin: false };
  if (!c) {
    return { ...base, pode: { concluirAny: false, concluirOwn: false, submeter: false, registrarCliente: false, aprovar: false, rejeitar: false, solicitarAlteracoes: false, cancelar: false, verHistorico: false } };
  }
  return {
    username: c.username,
    superAdmin: c.superAdmin,
    pode: {
      concluirAny: tem(c, "demandas.complete_any"),
      concluirOwn: tem(c, "demandas.complete_own"),
      submeter: tem(c, "demandas.submit_for_approval"),
      registrarCliente: tem(c, "demandas.report_client_approval"),
      aprovar: tem(c, "demandas.approve"),
      rejeitar: tem(c, "demandas.reject"),
      solicitarAlteracoes: tem(c, "demandas.request_changes"),
      cancelar: tem(c, "demandas.revoke_approval"),
      verHistorico: tem(c, "demandas.view_approval_history"),
    },
  };
}

export type DemandaAprovacao = {
  id: number;
  titulo: string;
  responsavel: string;
  clienteNome: string | null;
  prioridade: string;
  status: string; // execução
  approvalStatus: string;
  rodada: number;
  completedByLabel: string;
  completedEmLabel: string | null;
  approvedEmLabel: string | null;
  ehMinha: boolean;
};

// Demandas relevantes pra aprovação (concluídas ou com fluxo de aprovação).
export async function listDemandasAprovacao(): Promise<DemandaAprovacao[]> {
  const c = await ctx();
  if (!c) return [];
  const db = getDb();
  const [ds, cs] = await Promise.all([
    db.select().from(demandas).orderBy(desc(demandas.submittedForApprovalAt), desc(demandas.completedAt)),
    db.select({ id: crmClientes.id, nome: crmClientes.nome }).from(crmClientes),
  ]);
  const nomeCliente = new Map(cs.map((x) => [x.id, x.nome]));

  return ds
    .map((d) => ({
      id: d.id,
      titulo: d.titulo,
      responsavel: d.responsavel,
      clienteNome: d.clienteId ? (nomeCliente.get(d.clienteId) ?? null) : null,
      prioridade: d.prioridade,
      status: d.status,
      approvalStatus: d.approvalStatus ?? "nao_enviada",
      rodada: d.currentApprovalRound ?? 0,
      completedByLabel: d.completedBy ?? "",
      completedEmLabel: d.completedAt ? new Date(d.completedAt).toLocaleString("pt-BR") : null,
      approvedEmLabel: d.approvedAt ? new Date(d.approvedAt).toLocaleString("pt-BR") : null,
      ehMinha: ehResponsavel(c, d.responsavel),
    }));
}

// ── Ações ────────────────────────────────────────────────────────────────────

export async function marcarConcluida(demandaId: number): Promise<Res> {
  const c = await ctx();
  if (!c) return { ok: false, erro: "Sessão inválida." };
  const d = await carregarDemanda(demandaId);
  if (!d) return { ok: false, erro: "Demanda não encontrada." };

  const autorizado = c.superAdmin || tem(c, "demandas.complete_any") || (tem(c, "demandas.complete_own") && ehResponsavel(c, d.responsavel));
  if (!autorizado) return { ok: false, erro: "Sem permissão para concluir esta demanda." };
  if (d.approvalStatus === "aguardando") return { ok: false, erro: "Já está aguardando aprovação." };

  const rodada = (d.currentApprovalRound ?? 0) + 1;
  const agora = new Date();
  await getDb().update(demandas).set({
    status: "concluido",
    completedAt: agora,
    completedBy: c.username,
    submittedForApprovalAt: agora,
    approvalStatus: "aguardando",
    currentApprovalRound: rodada,
    approvedAt: null,
    atualizadoEm: agora,
  }).where(eq(demandas.id, demandaId));

  await getDb().insert(demandApprovals).values({
    demandaId, rodada, status: "PENDING", reportedByUserId: c.username, criadoEm: agora,
  });
  revalidatePath(PATH);
  return { ok: true };
}

export async function registrarAprovacaoCliente(formData: FormData): Promise<Res> {
  const c = await ctx();
  if (!c) return { ok: false, erro: "Sessão inválida." };
  const demandaId = Number(formData.get("demandaId"));
  const d = await carregarDemanda(demandaId);
  if (!d) return { ok: false, erro: "Demanda não encontrada." };

  const autorizado = c.superAdmin || (tem(c, "demandas.report_client_approval") && ehResponsavel(c, d.responsavel));
  if (!autorizado) return { ok: false, erro: "Sem permissão para registrar a aprovação do cliente." };
  const rodada = d.currentApprovalRound ?? 0;
  if (rodada < 1) return { ok: false, erro: "Conclua a demanda antes de registrar a aprovação." };

  const aprovador = String(formData.get("aprovadorNome") ?? "").trim();
  const canal = String(formData.get("canal") ?? "").trim();
  const data = String(formData.get("data") ?? "").trim();
  const hora = String(formData.get("hora") ?? "00:00").trim();
  const nota = String(formData.get("nota") ?? "").trim();
  if (!aprovador) return { ok: false, erro: "Informe quem aprovou (cliente/contato)." };

  const decididoEm = data ? new Date(`${data}T${hora}:00-03:00`) : new Date();
  await getDb().insert(demandApprovals).values({
    demandaId, rodada, status: "APPROVED", approverType: "CLIENT",
    approverNome: aprovador, approvalSource: "EMPLOYEE_REPORTED_CLIENT_APPROVAL",
    reportedByUserId: c.username, canal, nota, decididoEm,
  });
  await getDb().update(demandas).set({ approvalStatus: "aprovada", approvedAt: decididoEm, atualizadoEm: new Date() }).where(eq(demandas.id, demandaId));
  revalidatePath(PATH);
  return { ok: true };
}

async function decisaoInterna(
  formData: FormData,
  perm: string,
  statusRow: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
): Promise<Res> {
  const c = await ctx();
  if (!c) return { ok: false, erro: "Sessão inválida." };
  const demandaId = Number(formData.get("demandaId"));
  const d = await carregarDemanda(demandaId);
  if (!d) return { ok: false, erro: "Demanda não encontrada." };
  if (!(c.superAdmin || tem(c, perm))) return { ok: false, erro: "Sem permissão para esta decisão." };

  const rodada = d.currentApprovalRound ?? 0;
  if (rodada < 1) return { ok: false, erro: "A demanda ainda não foi enviada para aprovação." };
  const nota = String(formData.get("nota") ?? "").trim();
  const agora = new Date();

  await getDb().insert(demandApprovals).values({
    demandaId, rodada, status: statusRow, approverType: "INTERNAL_USER",
    approverUserId: c.username, approverNome: c.nome, approvalSource: "INTERNAL_ADMIN",
    nota, decididoEm: agora,
  });

  const set: Partial<typeof demandas.$inferInsert> = { atualizadoEm: agora };
  if (statusRow === "APPROVED") { set.approvalStatus = "aprovada"; set.approvedAt = agora; }
  if (statusRow === "REJECTED") { set.approvalStatus = "rejeitada"; }
  if (statusRow === "CHANGES_REQUESTED") { set.approvalStatus = "alteracoes_solicitadas"; set.status = "andamento"; set.reopenedAt = agora; }
  await getDb().update(demandas).set(set).where(eq(demandas.id, demandaId));
  revalidatePath(PATH);
  return { ok: true };
}

export async function aprovarDemanda(formData: FormData): Promise<Res> {
  return decisaoInterna(formData, "demandas.approve", "APPROVED");
}
export async function rejeitarDemanda(formData: FormData): Promise<Res> {
  return decisaoInterna(formData, "demandas.reject", "REJECTED");
}
export async function solicitarAlteracoes(formData: FormData): Promise<Res> {
  return decisaoInterna(formData, "demandas.request_changes", "CHANGES_REQUESTED");
}

export async function cancelarAprovacao(formData: FormData): Promise<Res> {
  const c = await ctx();
  if (!c) return { ok: false, erro: "Sessão inválida." };
  const demandaId = Number(formData.get("demandaId"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  const d = await carregarDemanda(demandaId);
  if (!d) return { ok: false, erro: "Demanda não encontrada." };
  if (!(c.superAdmin || tem(c, "demandas.revoke_approval"))) return { ok: false, erro: "Sem permissão para cancelar aprovação." };

  const rodada = d.currentApprovalRound ?? 0;
  const ultima = (await getDb()
    .select()
    .from(demandApprovals)
    .where(and(eq(demandApprovals.demandaId, demandaId), eq(demandApprovals.rodada, rodada), eq(demandApprovals.status, "APPROVED")))
    .orderBy(desc(demandApprovals.id))
    .limit(1))[0];
  if (!ultima) return { ok: false, erro: "Não há aprovação para cancelar nesta rodada." };

  const agora = new Date();
  await getDb().update(demandApprovals).set({ status: "REVOKED", revogadoEm: agora, revogadoPor: c.username, motivoRevogacao: motivo }).where(eq(demandApprovals.id, ultima.id));
  await getDb().update(demandas).set({ approvalStatus: "aguardando", approvedAt: null, atualizadoEm: agora }).where(eq(demandas.id, demandaId));
  revalidatePath(PATH);
  return { ok: true };
}

export type HistoricoItem = {
  id: number;
  rodada: number;
  status: string;
  approverType: string;
  approverLabel: string;
  approvalSource: string;
  reportedBy: string;
  canal: string;
  nota: string;
  quando: string;
  revogadoPor: string;
  motivoRevogacao: string;
};

export async function getHistoricoAprovacao(demandaId: number): Promise<HistoricoItem[]> {
  const c = await ctx();
  if (!c) return [];
  const d = await carregarDemanda(demandaId);
  if (!d) return [];
  if (!(c.superAdmin || tem(c, "demandas.view_approval_history") || ehResponsavel(c, d.responsavel))) return [];

  const rows = await getDb().select().from(demandApprovals).where(eq(demandApprovals.demandaId, demandaId)).orderBy(asc(demandApprovals.id));
  return rows.map((r) => ({
    id: r.id,
    rodada: r.rodada,
    status: r.status,
    approverType: r.approverType,
    approverLabel: r.approverType === "CLIENT" ? r.approverNome : r.approverUserId || r.approverNome,
    approvalSource: r.approvalSource,
    reportedBy: r.reportedByUserId,
    canal: r.canal,
    nota: r.nota,
    quando: new Date(r.decididoEm ?? r.criadoEm).toLocaleString("pt-BR"),
    revogadoPor: r.revogadoPor,
    motivoRevogacao: r.motivoRevogacao,
  }));
}
