"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { presets, clientes } from "@/app/lib/db/schema";
import { newToken } from "@/app/lib/onboarding/tokens";
import { PRESETS_PADRAO } from "@/app/lib/onboarding/presets-padrao";
import { SESSION_COOKIE } from "@/app/lib/auth";
import type { FieldDef, FieldType } from "@/app/lib/onboarding/types";

const TIPOS_VALIDOS: FieldType[] = [
  "texto",
  "textarea",
  "select",
  "sim_nao",
  "numero",
  "data",
  "link",
];

function parseCampos(raw: string): FieldDef[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (f) =>
          f &&
          typeof f.id === "string" &&
          typeof f.label === "string" &&
          f.label.trim(),
      )
      .map((f): FieldDef => {
        const tipo: FieldType = TIPOS_VALIDOS.includes(f.tipo) ? f.tipo : "texto";
        const opcoes =
          tipo === "select" && Array.isArray(f.opcoes)
            ? f.opcoes.map(String).map((s: string) => s.trim()).filter(Boolean)
            : undefined;
        return {
          id: String(f.id),
          label: String(f.label).trim().slice(0, 300),
          tipo,
          obrigatorio: Boolean(f.obrigatorio),
          opcoes,
          ajuda: f.ajuda ? String(f.ajuda).trim().slice(0, 500) : undefined,
        };
      });
  } catch {
    return [];
  }
}

export async function createPreset(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const campos = parseCampos(String(formData.get("campos") ?? "[]"));
  if (!nome) return;
  await getDb().insert(presets).values({ nome, descricao, campos });
  revalidatePath("/admin", "layout");
  redirect("/admin/presets");
}

// Cria os presets padrão das ofertas (Site, Abertura Completa, Tráfego,
// Sistema, Dark Kitchen). Idempotente por NOME: pula os que já existem.
export async function seedPresetsPadrao() {
  const db = getDb();
  const existentes = await db.select({ nome: presets.nome }).from(presets);
  const jaTem = new Set(existentes.map((p) => p.nome));
  const novos = PRESETS_PADRAO.filter((p) => !jaTem.has(p.nome));
  if (novos.length > 0) {
    await db.insert(presets).values(novos);
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/presets");
}

export async function updatePreset(formData: FormData) {
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const campos = parseCampos(String(formData.get("campos") ?? "[]"));
  if (!id || !nome) return;
  await getDb()
    .update(presets)
    .set({ nome, descricao, campos })
    .where(eq(presets.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin/presets");
}

export async function deletePreset(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    // Se algum cliente usa esse preset, o FK (restrict) barra a exclusão.
    await getDb().delete(presets).where(eq(presets.id, id));
  } catch {
    // preset em uso: mantém.
  }
  revalidatePath("/admin", "layout");
}

export async function createClient(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const contato = String(formData.get("contato") ?? "").trim();
  const presetId = Number(formData.get("presetId"));
  if (!nome || !presetId) return;
  await getDb()
    .insert(clientes)
    .values({ nome, contato, presetId, token: newToken() });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function reopenClient(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb()
    .update(clientes)
    .set({ status: "reaberto" })
    .where(eq(clientes.id, id));
  revalidatePath("/admin", "layout");
}

export async function deleteClient(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  redirect("/contratos/login");
}
