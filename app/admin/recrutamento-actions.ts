"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { vagas, presets } from "@/app/lib/db/schema";
import { newToken } from "@/app/lib/onboarding/tokens";
import { salvarPreset } from "./actions";

const BASE = "/admin/equipe/recrutamento";

// ── Formulários de vaga (mesma tabela `presets`, escopo="recrutamento") ─────
export async function createFormularioVaga(formData: FormData) {
  await salvarPreset(formData, "recrutamento");
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/formularios`);
}

export async function updateFormularioVaga(formData: FormData) {
  if (!Number(formData.get("id"))) return;
  await salvarPreset(formData, "recrutamento");
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/formularios`);
}

// ── Vagas ─────────────────────────────────────────────────────────────────
function valorOuNulo(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return n > 0 ? n : null;
}

export async function createVaga(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const rows = await getDb()
    .insert(vagas)
    .values({
      nome,
      descricao: String(formData.get("descricao") ?? "").trim(),
      cargoId: valorOuNulo(formData.get("cargoId")),
      departamento: String(formData.get("departamento") ?? "").trim(),
      modelo: String(formData.get("modelo") ?? "presencial").trim() || "presencial",
      cidade: String(formData.get("cidade") ?? "").trim(),
      status: String(formData.get("status") ?? "rascunho").trim() || "rascunho",
      presetId: valorOuNulo(formData.get("presetId")),
      token: newToken(),
    })
    .returning({ id: vagas.id });
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/vagas/${rows[0]?.id}`);
}

export async function updateVaga(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb()
    .update(vagas)
    .set({
      nome: String(formData.get("nome") ?? "").trim(),
      descricao: String(formData.get("descricao") ?? "").trim(),
      cargoId: valorOuNulo(formData.get("cargoId")),
      departamento: String(formData.get("departamento") ?? "").trim(),
      modelo: String(formData.get("modelo") ?? "presencial").trim() || "presencial",
      cidade: String(formData.get("cidade") ?? "").trim(),
      status: String(formData.get("status") ?? "rascunho").trim() || "rascunho",
      presetId: valorOuNulo(formData.get("presetId")),
      atualizadoEm: new Date(),
    })
    .where(eq(vagas.id, id));
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/vagas`);
}

export async function deleteVaga(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  // Cascade: candidaturas e respostas dessa vaga somem junto (on delete cascade).
  await getDb().delete(vagas).where(eq(vagas.id, id));
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/vagas`);
}

// Fecha/reabre rapidamente (botão de card, sem abrir o form de edição).
export async function setVagaStatus(id: number, status: "rascunho" | "aberta" | "fechada") {
  if (!id) return;
  await getDb().update(vagas).set({ status, atualizadoEm: new Date() }).where(eq(vagas.id, id));
  revalidatePath(BASE, "layout");
}

export async function listFormulariosRecrutamento() {
  return getDb()
    .select()
    .from(presets)
    .where(eq(presets.escopo, "recrutamento"))
    .orderBy(presets.criadoEm);
}
