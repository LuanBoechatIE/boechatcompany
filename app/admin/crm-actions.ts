"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { leads, crmClientes } from "@/app/lib/db/schema";
import type { LeadStatus } from "@/app/lib/crm/types";

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
