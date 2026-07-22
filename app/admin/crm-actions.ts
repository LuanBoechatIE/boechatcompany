"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  leads,
  crmClientes,
  projetos,
  tarefas,
  demandas,
  estrategiaItems,
  mapasMentais,
} from "@/app/lib/db/schema";
import type {
  LeadStatus,
  TarefaStatus,
  DemandaStatus,
} from "@/app/lib/crm/types";

// ── Leads ──────────────────────────────────────────────────────────────────

export async function createLead(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  await getDb().insert(leads).values({
    nome,
    email: String(formData.get("email") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    empresa: String(formData.get("empresa") ?? "").trim(),
    setor: String(formData.get("setor") ?? "").trim(),
    faturamento: String(formData.get("faturamento") ?? "").trim(),
    status: "novo",
    origem: "manual",
  });
  revalidatePath("/admin/crm/leads");
  redirect("/admin/crm/leads");
}

export async function updateLeadStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (!id || !status) return;
  await getDb().update(leads).set({ status }).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

export async function deleteLead(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(leads).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

// Converte um lead em cliente de CRM e marca o lead como ganho.
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
    whatsapp: lead.whatsapp,
    leadId: lead.id,
  });
  await db.update(leads).set({ status: "ganho" }).where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm/clientes");
  redirect("/admin/crm/clientes");
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

export async function deleteCrmCliente(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(crmClientes).where(eq(crmClientes.id, id));
  revalidatePath("/admin/crm/clientes");
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

export async function createDemanda(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;
  await getDb().insert(demandas).values({
    titulo,
    descricao: String(formData.get("descricao") ?? "").trim(),
    responsavel: String(formData.get("responsavel") ?? "").trim(),
    prioridade: String(formData.get("prioridade") ?? "media"),
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
  await getDb().insert(estrategiaItems).values({
    titulo,
    fase,
    descricao: String(formData.get("descricao") ?? "").trim(),
    responsavel: String(formData.get("responsavel") ?? "").trim(),
    prioridade: String(formData.get("prioridade") ?? "media"),
    status: "todo",
  });
  revalidatePath("/admin/crm/estrategia");
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
}

export async function deleteEstrategiaItem(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(estrategiaItems).where(eq(estrategiaItems.id, id));
  revalidatePath("/admin/crm/estrategia");
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
