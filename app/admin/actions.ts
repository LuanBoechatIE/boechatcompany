"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { presets, clientes } from "@/app/lib/db/schema";
import { newToken } from "@/app/lib/onboarding/tokens";
import { PRESETS_PADRAO } from "@/app/lib/onboarding/presets-padrao";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { exigirPermissao } from "@/app/lib/perms-guard";
import { registrarAudit, origemDoPedido } from "@/app/lib/audit";
// salvarPreset saiu deste arquivo de propósito: em "use server", todo export
// vira endpoint público sem login. Agora mora em app/lib/presets/salvar.ts. A7.
import { salvarPreset } from "@/app/lib/presets/salvar";

export async function createPreset(formData: FormData) {
  await exigirPermissao("presets.criar");
  await salvarPreset(formData, "onboarding");
  revalidatePath("/admin", "layout");
  redirect("/admin/presets");
}

// Cria os presets padrão das ofertas (Site, Abertura Completa, Tráfego,
// Sistema, Dark Kitchen). Idempotente por NOME: pula os que já existem.
export async function seedPresetsPadrao() {
  await exigirPermissao("presets.gerenciar");
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
  await exigirPermissao("presets.editar");
  if (!Number(formData.get("id"))) return;
  await salvarPreset(formData, "onboarding");
  revalidatePath("/admin", "layout");
  redirect("/admin/presets");
}

export async function deletePreset(formData: FormData) {
  await exigirPermissao("presets.excluir");
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
  await exigirPermissao("onboardings.criar");
  const nome = String(formData.get("nome") ?? "").trim();
  const contato = String(formData.get("contato") ?? "").trim();
  const presetId = Number(formData.get("presetId"));
  if (!nome || !presetId) return;
  await getDb()
    .insert(clientes)
    .values({ nome, contato, presetId, token: newToken() });
  revalidatePath("/admin", "layout");
  redirect("/admin/onboardings");
}

export async function reopenClient(formData: FormData) {
  await exigirPermissao("onboardings.editar");
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb()
    .update(clientes)
    .set({ status: "reaberto" })
    .where(eq(clientes.id, id));
  revalidatePath("/admin", "layout");
}

export async function deleteClient(formData: FormData) {
  await exigirPermissao("onboardings.excluir");
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/admin", "layout");
  redirect("/admin/onboardings");
}

export async function logout() {
  const c = await cookies();
  // Lido ANTES de apagar: depois do delete não há mais como saber quem saiu.
  const quem = (await verifySession(c.get(SESSION_COOKIE)?.value)) ?? "";
  c.delete(SESSION_COOKIE);
  await registrarAudit({
    ator: quem,
    acao: "logout",
    resultado: "ok",
    ...origemDoPedido(await headers()),
  });
  redirect("/contratos/login");
}
