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
import { exigirSuperAdmin, exigirPermissao } from "@/app/lib/perms-guard";
import { salvarPreset } from "@/app/lib/presets/salvar";
import { gerarSenhaTemporariaPura } from "@/app/lib/usuarios/gerar";
import { prepararPreviewAcesso, confirmarCriarAcesso, type PreviewAcesso } from "@/app/lib/usuarios/provisionamento";

const BASE = "/admin/equipe/recrutamento";

// ── Formulários de vaga (mesma tabela `presets`, escopo="recrutamento") ─────
export async function createFormularioVaga(formData: FormData) {
  await exigirPermissao("recrutamento.gerenciar");
  await salvarPreset(formData, "recrutamento");
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/formularios`);
}

export async function updateFormularioVaga(formData: FormData) {
  await exigirPermissao("recrutamento.gerenciar");
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
  await exigirPermissao("recrutamento.criar");
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
  await exigirPermissao("recrutamento.editar");
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
  await exigirPermissao("recrutamento.excluir");
  const id = Number(formData.get("id"));
  if (!id) return;
  // Cascade: candidaturas e respostas dessa vaga somem junto (on delete cascade).
  await getDb().delete(vagas).where(eq(vagas.id, id));
  revalidatePath(BASE, "layout");
  redirect(`${BASE}/vagas`);
}

// Fecha/reabre rapidamente (botão de card, sem abrir o form de edição).
export async function setVagaStatus(id: number, status: "rascunho" | "aberta" | "fechada") {
  await exigirPermissao("recrutamento.editar");
  if (!id) return;
  await getDb().update(vagas).set({ status, atualizadoEm: new Date() }).where(eq(vagas.id, id));
  revalidatePath(BASE, "layout");
}

// ── Candidaturas ─────────────────────────────────────────────────────────
export async function deleteCandidatura(formData: FormData) {
  await exigirPermissao("recrutamento.excluir");
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
  const senhaTemporaria = gerarSenhaTemporariaPura();

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

// ── Contratação com prévia (Melhoria 1/2) ───────────────────────────────
// contratarCandidatura acima continua existindo e funcionando exatamente
// como antes (compatibilidade); estas duas actions abaixo são o novo fluxo
// com prévia, usado pelo ContratarBotao a partir de agora. Reaproveitam o
// gerador de login unificado (nome@boechat.com, mesmo padrão de
// usuarios-actions.ts) em vez do slug local desta tela.
export type PreviewContratacaoResult =
  | { ok: false; erro: string }
  | { ok: true; preview: PreviewAcesso; candidaturaId: number };

export async function prepararPreviewContratacao(formData: FormData): Promise<PreviewContratacaoResult> {
  await exigirSuperAdmin();
  const candidaturaId = Number(formData.get("candidaturaId"));
  if (!candidaturaId) return { ok: false, erro: "Candidatura inválida." };

  const db = getDb();
  const candidatura = (await db.select().from(candidaturas).where(eq(candidaturas.id, candidaturaId)).limit(1))[0];
  if (!candidatura) return { ok: false, erro: "Candidatura não encontrada." };
  if (candidatura.status === "contratado") return { ok: false, erro: "Esta candidatura já foi contratada." };
  if (!candidatura.email) return { ok: false, erro: "Candidatura sem e-mail, não é possível criar o acesso." };

  const vaga = (await db.select().from(vagas).where(eq(vagas.id, candidatura.vagaId)).limit(1))[0];
  const cargoId = Number(formData.get("cargoId")) || vaga?.cargoId || null;

  const preview = await prepararPreviewAcesso({ nome: candidatura.nome, emailPessoal: candidatura.email, cargoId });
  return { ok: true, preview, candidaturaId };
}

export type ConfirmarContratacaoResult =
  | { ok: false; erro: string }
  | { ok: true; username: string; emailEnviado: boolean; emailMotivo?: string; senhaTemporaria?: string };

// Confirma a partir do que foi mostrado na prévia. Revalida disponibilidade
// de login/e-mail (podem ter mudado desde a prévia) antes de gravar. Senha
// só volta na resposta se o e-mail falhar (fail-soft, pra repasse manual) —
// se o envio deu certo, ela não é mais recuperável por aqui.
export async function confirmarContratacao(formData: FormData): Promise<ConfirmarContratacaoResult> {
  const ator = await exigirSuperAdmin();
  const candidaturaId = Number(formData.get("candidaturaId"));
  if (!candidaturaId) return { ok: false, erro: "Candidatura inválida." };

  const db = getDb();
  const candidatura = (await db.select().from(candidaturas).where(eq(candidaturas.id, candidaturaId)).limit(1))[0];
  if (!candidatura) return { ok: false, erro: "Candidatura não encontrada." };
  if (candidatura.status === "contratado") return { ok: false, erro: "Esta candidatura já foi contratada." };

  const cargoId = valorOuNulo(formData.get("cargoId"));
  const login = String(formData.get("login") ?? "").trim().toLowerCase();
  const senhaTemporaria = String(formData.get("senhaTemporaria") ?? "");
  const assunto = String(formData.get("assunto") ?? "") || undefined;
  const saudacaoCustom = String(formData.get("saudacaoCustom") ?? "") || undefined;
  const textoComplementar = String(formData.get("textoComplementar") ?? "") || undefined;
  if (!login || !senhaTemporaria) return { ok: false, erro: "Gere a prévia novamente." };

  const resultado = await confirmarCriarAcesso({
    ator: ator.username,
    nome: candidatura.nome,
    emailPessoal: candidatura.email,
    telefone: candidatura.telefone,
    cargoId,
    login,
    senhaTemporaria,
    assunto,
    saudacaoCustom,
    textoComplementar,
    acaoAudit: "candidatura.contratada",
  });
  if (!resultado.ok) return resultado;

  await db.update(candidaturas).set({ status: "contratado", usuarioId: resultado.usuarioId }).where(eq(candidaturas.id, candidaturaId));

  revalidatePath(BASE, "layout");
  revalidatePath("/admin/configuracoes");
  return {
    ok: true,
    username: resultado.username,
    emailEnviado: resultado.emailEnviado,
    emailMotivo: resultado.emailMotivo,
    senhaTemporaria: resultado.emailEnviado ? undefined : senhaTemporaria,
  };
}

export async function listFormulariosRecrutamento() {
  await exigirPermissao("recrutamento.visualizar");
  return getDb()
    .select()
    .from(presets)
    .where(eq(presets.escopo, "recrutamento"))
    .orderBy(presets.criadoEm);
}
