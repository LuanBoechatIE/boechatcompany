"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  leads,
  leadAtividades,
  crmClientes,
  projetos,
  tarefas,
  demandas,
  estrategiaItems,
  mapasMentais,
} from "@/app/lib/db/schema";
import { LEAD_STAGES } from "@/app/lib/crm/types";
import type {
  LeadStatus,
  TarefaStatus,
  DemandaStatus,
} from "@/app/lib/crm/types";

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

async function registrarAtividade(
  leadId: number,
  tipo: string,
  texto: string,
) {
  await getDb().insert(leadAtividades).values({ leadId, tipo, texto });
}

export async function createLead(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
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
      tags: String(formData.get("tags") ?? "").trim(),
      observacoes: String(formData.get("observacoes") ?? "").trim(),
      status: "novo",
    })
    .returning({ id: leads.id });
  const novoId = rows[0]?.id;
  if (novoId) await registrarAtividade(novoId, "evento", "Lead criado");
  revalidatePath("/admin/crm/leads");
}

export async function updateLead(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb()
    .update(leads)
    .set({
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
      proximoContato: parsePrazo(formData.get("proximoContato")),
      tags: String(formData.get("tags") ?? "").trim(),
      observacoes: String(formData.get("observacoes") ?? "").trim(),
    })
    .where(eq(leads.id, id));
  revalidatePath("/admin/crm/leads");
}

// Client-callable: usado no drag & drop do Kanban.
export async function updateLeadStatus(id: number, status: LeadStatus) {
  if (!id || !status) return;
  const stage =
    LEAD_STAGES.find((s) => s.key === status)?.label ?? status;
  await getDb().update(leads).set({ status }).where(eq(leads.id, id));
  await registrarAtividade(id, "evento", `Movido para ${stage}`);
  revalidatePath("/admin/crm/leads");
}

export async function markLeadLost(formData: FormData) {
  const id = Number(formData.get("id"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!id) return;
  await getDb()
    .update(leads)
    .set({ status: "perdido", motivoPerda: motivo })
    .where(eq(leads.id, id));
  await registrarAtividade(id, "evento", `Perdido${motivo ? `: ${motivo}` : ""}`);
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
    .set({ status: "convertido", arquivado: true })
    .where(eq(leads.id, id));
  await registrarAtividade(id, "evento", "Convertido em cliente");
  revalidatePath("/admin/crm/leads");
  revalidatePath("/admin/crm/clientes");
  redirect("/admin/crm/clientes");
}

// ── Atividades do lead (notas, tarefas, histórico) ───────────────────────────

export async function addAtividade(formData: FormData) {
  const leadId = Number(formData.get("leadId"));
  const texto = String(formData.get("texto") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "nota").trim() || "nota";
  if (!leadId || !texto) return;
  await getDb().insert(leadAtividades).values({
    leadId,
    tipo,
    texto,
    data: parsePrazo(formData.get("data")),
    autor: String(formData.get("autor") ?? "").trim(),
  });
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
