"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, cargos, userCargos, roles, userRoles } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { hashSenha, verificarSenha } from "@/app/lib/auth-db";
import { resolverPermissoes, ehAdminInicial } from "@/app/lib/permissoes";

export type Cargo = { label: string; cor?: string };

export type PerfilView = {
  id: number;
  username: string;
  nome: string;
  email: string;
  foto: string;
  cargos: Cargo[];
  status: string;
  superAdmin: boolean;
  permissoes: string[];
  preferencias: Record<string, string>;
  criadoEmLabel: string;
  ultimoAcessoLabel: string | null;
  trocaSenhaObrigatoria: boolean;
};

// Garante que os admins iniciais (Samuel/Luan) tenham super_admin — via banco,
// sem depender de nome hardcoded em componentes.
async function garantirSuperAdmin(usuarioId: number, username: string): Promise<void> {
  if (!ehAdminInicial(username)) return;
  const db = getDb();
  const r = (await db.select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];
  if (!r) return;
  await db.insert(userRoles).values({ usuarioId, roleId: r.id }).onConflictDoNothing();
}

async function cargosDoUsuario(usuarioId: number): Promise<Cargo[]> {
  const rows = await getDb()
    .select({ label: cargos.nome, cor: cargos.cor })
    .from(userCargos)
    .innerJoin(cargos, eq(userCargos.cargoId, cargos.id))
    .where(eq(userCargos.usuarioId, usuarioId));
  return rows;
}

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

  let rows;
  try {
    rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
    if (rows.length === 0) {
      await db
        .insert(usuarios)
        .values({ username, nomeCompleto: capitalize(username), ultimoAcesso: new Date() })
        .onConflictDoNothing({ target: usuarios.username });
      rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
    } else {
      await db.update(usuarios).set({ ultimoAcesso: new Date() }).where(eq(usuarios.username, username));
    }
  } catch {
    // Tabela `usuarios` ainda não criada (falta rodar o crm.sql) ou banco fora.
    return null;
  }
  if (rows.length === 0) return null;
  const u = rows[0];

  let listaCargos: Cargo[] = [];
  let perms = { superAdmin: false, permissoes: [] as string[] };
  try {
    await garantirSuperAdmin(u.id, username);
    [listaCargos, perms] = await Promise.all([cargosDoUsuario(u.id), resolverPermissoes(u.id)]);
  } catch {
    // Tabelas de cargos/roles ainda não criadas: perfil funciona sem elas.
  }

  return {
    id: u.id,
    username: u.username,
    nome: u.nomeCompleto || capitalize(u.username),
    email: u.email,
    foto: u.foto,
    cargos: listaCargos,
    status: u.status,
    superAdmin: perms.superAdmin,
    permissoes: perms.permissoes,
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
