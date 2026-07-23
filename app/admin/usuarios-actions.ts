"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, cargos, userCargos, roles, userRoles } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { hashSenha } from "@/app/lib/auth-db";
import { resolverPermissoes } from "@/app/lib/permissoes";

const CFG_PATH = "/admin/configuracoes";

async function exigirSuperAdmin(): Promise<number> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) throw new Error("Não autorizado.");
  const u = (await getDb().select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  if (!u) throw new Error("Não autorizado.");
  const perms = await resolverPermissoes(u.id);
  if (!perms.superAdmin) throw new Error("Acesso restrito a superadministradores.");
  return u.id;
}

// Senha temporária legível (com letra e número, atende aos requisitos).
export async function gerarSenhaTemporaria(): Promise<string> {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const nums = "23456789";
  const todos = letras + nums;
  let s = letras[Math.floor(Math.random() * letras.length)] + nums[Math.floor(Math.random() * nums.length)];
  for (let i = 0; i < 8; i++) s += todos[Math.floor(Math.random() * todos.length)];
  return s;
}

export type UsuarioAdmin = {
  id: number;
  username: string;
  nome: string;
  email: string;
  foto: string;
  status: string;
  superAdmin: boolean;
  trocaSenhaObrigatoria: boolean;
  cargos: { id: number; nome: string; cor: string }[];
  criadoEmLabel: string;
  ultimoAcessoLabel: string | null;
};

async function idSuperRole(): Promise<number | null> {
  const r = (await getDb().select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];
  return r?.id ?? null;
}

export async function listUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  await exigirSuperAdmin();
  const db = getDb();
  const us = await db.select().from(usuarios).orderBy(asc(usuarios.username));
  const superId = await idSuperRole();

  const out: UsuarioAdmin[] = [];
  for (const u of us) {
    const cs = await db
      .select({ id: cargos.id, nome: cargos.nome, cor: cargos.cor })
      .from(userCargos)
      .innerJoin(cargos, eq(userCargos.cargoId, cargos.id))
      .where(eq(userCargos.usuarioId, u.id));
    const sup = superId
      ? (await db.select({ id: userRoles.id }).from(userRoles).where(and(eq(userRoles.usuarioId, u.id), eq(userRoles.roleId, superId))).limit(1)).length > 0
      : false;
    out.push({
      id: u.id,
      username: u.username,
      nome: u.nomeCompleto || u.username,
      email: u.email,
      foto: u.foto,
      status: u.status,
      superAdmin: sup,
      trocaSenhaObrigatoria: u.trocaSenhaObrigatoria,
      cargos: cs,
      criadoEmLabel: new Date(u.criadoEm).toLocaleDateString("pt-BR"),
      ultimoAcessoLabel: u.ultimoAcesso ? new Date(u.ultimoAcesso).toLocaleString("pt-BR") : null,
    });
  }
  return out;
}

function validarUsername(u: string): boolean {
  return /^[a-z0-9._-]{3,}$/.test(u);
}
function senhaValida(s: string): boolean {
  return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
}

export async function criarUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const db = getDb();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const trocar = String(formData.get("trocar") ?? "true") === "true";
  const cargosIds = String(formData.get("cargos") ?? "").split(",").map(Number).filter(Boolean);

  if (!validarUsername(username)) return { ok: false, erro: "Login inválido (mín. 3, letras minúsculas, números, . _ -)." };
  if (!nome) return { ok: false, erro: "Informe o nome." };
  if (!senhaValida(senha)) return { ok: false, erro: "Senha temporária precisa de 8+ caracteres, com letra e número." };

  const jaUsername = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  if (jaUsername) return { ok: false, erro: "Já existe um usuário com esse login." };
  if (email) {
    const jaEmail = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1))[0];
    if (jaEmail) return { ok: false, erro: "Já existe um usuário com esse e-mail." };
  }

  const inserido = await db
    .insert(usuarios)
    .values({ username, nomeCompleto: nome, email, senhaHash: hashSenha(senha), trocaSenhaObrigatoria: trocar })
    .returning({ id: usuarios.id });
  const novoId = inserido[0].id;

  if (cargosIds.length) {
    await db.insert(userCargos).values(cargosIds.map((cargoId) => ({ usuarioId: novoId, cargoId }))).onConflictDoNothing();
  }
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function editarUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const db = getDb();
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, erro: "Usuário inválido." };
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!nome) return { ok: false, erro: "Informe o nome." };
  if (email) {
    const outro = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, email)).limit(1))[0];
    if (outro && outro.id !== id) return { ok: false, erro: "E-mail já usado por outro usuário." };
  }
  await db.update(usuarios).set({ nomeCompleto: nome, email }).where(eq(usuarios.id, id));
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Bloquear/reativar. Bloqueado não consegue mais logar (verificarSenha nega).
export async function definirStatusUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const atorId = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const bloquear = String(formData.get("bloquear") ?? "") === "true";
  if (!id) return { ok: false, erro: "Usuário inválido." };
  if (bloquear && id === atorId) return { ok: false, erro: "Você não pode bloquear a si mesmo." };

  // Não bloquear o último superadmin ativo.
  if (bloquear) {
    const superId = await idSuperRole();
    if (superId) {
      const db = getDb();
      const ehSuper = (await db.select({ id: userRoles.id }).from(userRoles).where(and(eq(userRoles.usuarioId, id), eq(userRoles.roleId, superId))).limit(1)).length > 0;
      if (ehSuper) {
        const superAtivos = await db
          .select({ uid: userRoles.usuarioId, status: usuarios.status })
          .from(userRoles)
          .innerJoin(usuarios, eq(userRoles.usuarioId, usuarios.id))
          .where(eq(userRoles.roleId, superId));
        const ativos = superAtivos.filter((s) => s.status !== "bloqueado").length;
        if (ativos <= 1) return { ok: false, erro: "Não é possível bloquear o último superadministrador ativo." };
      }
    }
  }

  await getDb().update(usuarios).set({ status: bloquear ? "bloqueado" : "ativo" }).where(eq(usuarios.id, id));
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function redefinirSenhaUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const nova = String(formData.get("senha") ?? "");
  const trocar = String(formData.get("trocar") ?? "true") === "true";
  if (!id) return { ok: false, erro: "Usuário inválido." };
  if (!senhaValida(nova)) return { ok: false, erro: "Senha precisa de 8+ caracteres, com letra e número." };
  await getDb().update(usuarios).set({ senhaHash: hashSenha(nova), trocaSenhaObrigatoria: trocar }).where(eq(usuarios.id, id));
  revalidatePath(CFG_PATH);
  return { ok: true };
}
