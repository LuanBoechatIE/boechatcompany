"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { vagas, presets, candidaturas, usuarios, userCargos } from "@/app/lib/db/schema";
import { newToken } from "@/app/lib/onboarding/tokens";
import { hashSenha } from "@/app/lib/auth-db";
import { enviarEmail } from "@/app/lib/email/resend";
import { templateBoasVindas } from "@/app/lib/email/boas-vindas";
import { registrarAudit } from "@/app/lib/audit";
import { salvarPreset } from "./actions";
import { exigirSuperAdmin, gerarSenhaTemporaria } from "./usuarios-actions";

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

// ── Candidaturas ─────────────────────────────────────────────────────────
export async function deleteCandidatura(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  // Irreversível: some do banco (a resposta cai junto via on delete cascade).
  await getDb().delete(candidaturas).where(eq(candidaturas.id, id));
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/candidatos`);
}

function slugUsername(nome: string): string {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(".")
    .replace(/[^a-z0-9._-]/g, "");
  return base.length >= 3 ? base : `${base}.usuario`.slice(0, 40);
}

async function usernameDisponivel(nome: string): Promise<string> {
  const db = getDb();
  const base = slugUsername(nome);
  let candidato = base;
  let n = 1;
  while ((await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, candidato)).limit(1)).length > 0) {
    n += 1;
    candidato = `${base}${n}`;
  }
  return candidato;
}

export type ContratarResult =
  | { ok: false; erro: string }
  | { ok: true; username: string; senhaTemporaria: string; emailEnviado: boolean; emailMotivo?: string };

// Contrata: cria usuário da plataforma (senha temporária de uso único, hash
// só, nunca texto puro salvo), assina o cargo, marca a candidatura como
// contratada e manda o e-mail de boas-vindas (fail-soft: se o e-mail não
// sair, a senha volta na resposta pra ser passada manualmente).
export async function contratarCandidatura(formData: FormData): Promise<ContratarResult> {
  const ator = await exigirSuperAdmin();
  const candidaturaId = Number(formData.get("candidaturaId"));
  if (!candidaturaId) return { ok: false, erro: "Candidatura inválida." };

  const db = getDb();
  const cRows = await db.select().from(candidaturas).where(eq(candidaturas.id, candidaturaId)).limit(1);
  const candidatura = cRows[0];
  if (!candidatura) return { ok: false, erro: "Candidatura não encontrada." };
  if (candidatura.status === "contratado") return { ok: false, erro: "Esta candidatura já foi contratada." };
  if (!candidatura.email) return { ok: false, erro: "Candidatura sem e-mail, não é possível criar o acesso." };

  const vagaRows = await db.select().from(vagas).where(eq(vagas.id, candidatura.vagaId)).limit(1);
  const vaga = vagaRows[0];
  const cargoId = Number(formData.get("cargoId")) || vaga?.cargoId || null;

  const jaEmail = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, candidatura.email)).limit(1))[0];
  if (jaEmail) return { ok: false, erro: "Já existe um usuário com este e-mail." };

  const username = await usernameDisponivel(candidatura.nome);
  const senhaTemporaria = await gerarSenhaTemporaria();

  const inserido = await db
    .insert(usuarios)
    .values({
      username,
      nomeCompleto: candidatura.nome,
      email: candidatura.email,
      telefone: candidatura.telefone,
      senhaHash: hashSenha(senhaTemporaria),
      trocaSenhaObrigatoria: true,
    })
    .returning({ id: usuarios.id });
  const novoUsuarioId = inserido[0].id;

  if (cargoId) {
    await db.insert(userCargos).values({ usuarioId: novoUsuarioId, cargoId }).onConflictDoNothing();
  }

  await db
    .update(candidaturas)
    .set({ status: "contratado", usuarioId: novoUsuarioId })
    .where(eq(candidaturas.id, candidaturaId));

  const urlPlataforma = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/contratos/login`
    : "https://boechatcompany.com/contratos/login";
  const { subject, html } = templateBoasVindas({
    nome: candidatura.nome,
    username,
    senhaTemporaria,
    urlPlataforma,
  });
  const envio = await enviarEmail({ to: candidatura.email, subject, html });

  await registrarAudit({
    ator: ator.username,
    afetado: username,
    acao: "candidatura.contratada",
    detalhe: envio.ok ? "e-mail enviado" : `e-mail falhou: ${envio.motivo}`,
  });

  revalidatePath(BASE, "layout");
  revalidatePath("/admin/configuracoes");
  return { ok: true, username, senhaTemporaria, emailEnviado: envio.ok, emailMotivo: envio.motivo };
}

export async function listFormulariosRecrutamento() {
  return getDb()
    .select()
    .from(presets)
    .where(eq(presets.escopo, "recrutamento"))
    .orderBy(presets.criadoEm);
}
