"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { hashSenha, verificarSenha } from "@/app/lib/auth-db";

export type Cargo = { label: string; cor?: string };

export type PerfilView = {
  username: string;
  nome: string;
  email: string;
  foto: string;
  cargos: Cargo[];
  status: string;
  preferencias: Record<string, string>;
  criadoEmLabel: string;
  ultimoAcessoLabel: string | null;
  trocaSenhaObrigatoria: boolean;
};

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

async function usernameAtual(): Promise<string | null> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

// Garante uma linha de perfil pro usuário logado (auto-provisiona no 1º acesso)
// e devolve uma visão segura (sem hash de senha).
export async function getPerfilAtual(): Promise<PerfilView | null> {
  const username = await usernameAtual();
  if (!username) return null;
  const db = getDb();

  let rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
  if (rows.length === 0) {
    await db
      .insert(usuarios)
      .values({
        username,
        nomeCompleto: capitalize(username),
        cargos: [{ label: "Administrador" }],
        ultimoAcesso: new Date(),
      })
      .onConflictDoNothing({ target: usuarios.username });
    rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
  } else {
    await db
      .update(usuarios)
      .set({ ultimoAcesso: new Date() })
      .where(eq(usuarios.username, username));
  }

  const u = rows[0];
  return {
    username: u.username,
    nome: u.nomeCompleto || capitalize(u.username),
    email: u.email,
    foto: u.foto,
    cargos: (u.cargos as Cargo[]) ?? [],
    status: u.status,
    preferencias: (u.preferencias as Record<string, string>) ?? {},
    criadoEmLabel: new Date(u.criadoEm).toLocaleDateString("pt-BR"),
    ultimoAcessoLabel: u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString("pt-BR") : null,
    trocaSenhaObrigatoria: u.trocaSenhaObrigatoria,
  };
}

// Atualiza o PRÓPRIO perfil. Nunca mexe em cargos/permissões/status (isso é
// responsabilidade de admin, em etapa futura).
export async function atualizarMeuPerfil(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const username = await usernameAtual();
  if (!username) return { ok: false, erro: "Sessão inválida." };
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  if (!g("nome")) return { ok: false, erro: "Informe seu nome." };

  await getDb()
    .update(usuarios)
    .set({ nomeCompleto: g("nome"), email: g("email"), foto: g("foto") })
    .where(eq(usuarios.username, username));
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// Preferências pessoais (jsonb). Mescla com o que já existe.
export async function atualizarPreferencias(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const username = await usernameAtual();
  if (!username) return { ok: false, erro: "Sessão inválida." };

  const prefsAtuais = (
    await getDb().select({ p: usuarios.preferencias }).from(usuarios).where(eq(usuarios.username, username)).limit(1)
  )[0]?.p as Record<string, string> | undefined;

  const preferencias = {
    ...(prefsAtuais ?? {}),
    calendarioVista: String(formData.get("calendarioVista") ?? "mes"),
  };
  await getDb().update(usuarios).set({ preferencias }).where(eq(usuarios.username, username));
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

// Requisitos mínimos: 8+ caracteres, ao menos uma letra e um número.
function senhaValida(s: string): boolean {
  return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
}

export async function alterarMinhaSenha(
  formData: FormData,
): Promise<{ ok: boolean; erro?: string }> {
  const username = await usernameAtual();
  if (!username) return { ok: false, erro: "Sessão inválida." };

  const atual = String(formData.get("senhaAtual") ?? "");
  const nova = String(formData.get("novaSenha") ?? "");
  const confirmar = String(formData.get("confirmarSenha") ?? "");

  if (!(await verificarSenha(username, atual))) return { ok: false, erro: "Senha atual incorreta." };
  if (!senhaValida(nova)) return { ok: false, erro: "A nova senha precisa de 8+ caracteres, com letra e número." };
  if (nova !== confirmar) return { ok: false, erro: "As senhas não coincidem." };
  if (nova === atual) return { ok: false, erro: "A nova senha deve ser diferente da atual." };

  await getDb()
    .update(usuarios)
    .set({ senhaHash: hashSenha(nova), trocaSenhaObrigatoria: false })
    .where(eq(usuarios.username, username));
  // Observação: revogar outras sessões vem na Etapa 3 (versão de sessão).
  return { ok: true };
}
