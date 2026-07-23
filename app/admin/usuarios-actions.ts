"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, cargos, userCargos, roles, userRoles, auditLogs } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { hashSenha } from "@/app/lib/auth-db";
import { resolverPermissoes } from "@/app/lib/permissoes";
import { registrarAudit } from "@/app/lib/audit";

const CFG_PATH = "/admin/configuracoes";

type Ator = { id: number; username: string };

async function exigirSuperAdmin(): Promise<Ator> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) throw new Error("Não autorizado.");
  const u = (await getDb().select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  if (!u) throw new Error("Não autorizado.");
  const perms = await resolverPermissoes(u.id);
  if (!perms.superAdmin) throw new Error("Acesso restrito a superadministradores.");
  return { id: u.id, username };
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
  protegido: boolean;
  excluido: boolean;
  trocaSenhaObrigatoria: boolean;
  cargos: { id: number; nome: string; cor: string }[];
  criadoEmLabel: string;
  ultimoAcessoLabel: string | null;
};

async function idSuperRole(): Promise<number | null> {
  const r = (await getDb().select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];
  return r?.id ?? null;
}

async function ehSuperAdminUsuario(usuarioId: number): Promise<boolean> {
  const superId = await idSuperRole();
  if (!superId) return false;
  return (await getDb().select({ id: userRoles.id }).from(userRoles).where(and(eq(userRoles.usuarioId, usuarioId), eq(userRoles.roleId, superId))).limit(1)).length > 0;
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
      protegido: u.protectedSuperAdmin,
      excluido: !!u.deletedAt,
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
  const ator = await exigirSuperAdmin();
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
  await registrarAudit({ ator: ator.username, afetado: username, acao: "usuario.criado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function editarUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
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
  await registrarAudit({ ator: ator.username, afetado: String(id), acao: "usuario.editado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Bloquear/reativar. Bloqueado não consegue mais logar (verificarSenha nega).
// Conta protegida (Samuel/Luan) nunca pode ser bloqueada.
export async function definirStatusUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const bloquear = String(formData.get("bloquear") ?? "") === "true";
  if (!id) return { ok: false, erro: "Usuário inválido." };
  const db = getDb();
  const alvo = (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!alvo) return { ok: false, erro: "Usuário não encontrado." };

  if (bloquear) {
    if (alvo.protectedSuperAdmin) {
      await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.bloquear", resultado: "bloqueado", detalhe: "conta protegida" });
      return { ok: false, erro: "Esta conta é protegida e não pode ser bloqueada." };
    }
    if (id === ator.id) return { ok: false, erro: "Você não pode bloquear a si mesmo." };
    // Não bloquear o último superadmin ativo.
    if (await ehSuperAdminUsuario(id)) {
      const superId = await idSuperRole();
      const superAtivos = await db
        .select({ status: usuarios.status, del: usuarios.deletedAt })
        .from(userRoles)
        .innerJoin(usuarios, eq(userRoles.usuarioId, usuarios.id))
        .where(eq(userRoles.roleId, superId!));
      const ativos = superAtivos.filter((s) => s.status !== "bloqueado" && !s.del).length;
      if (ativos <= 1) return { ok: false, erro: "Não é possível bloquear o último superadministrador ativo." };
    }
  }

  await db.update(usuarios).set({ status: bloquear ? "bloqueado" : "ativo" }).where(eq(usuarios.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: bloquear ? "usuario.bloqueado" : "usuario.reativado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function redefinirSenhaUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const nova = String(formData.get("senha") ?? "");
  const trocar = String(formData.get("trocar") ?? "true") === "true";
  if (!id) return { ok: false, erro: "Usuário inválido." };
  const alvo = (await getDb().select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
  if (alvo.deletedAt) return { ok: false, erro: "Conta excluída." };
  if (!senhaValida(nova)) return { ok: false, erro: "Senha precisa de 8+ caracteres, com letra e número." };
  await getDb().update(usuarios).set({ senhaHash: hashSenha(nova), trocaSenhaObrigatoria: trocar }).where(eq(usuarios.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.senha_redefinida" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Exclusão lógica (soft delete). Preserva o histórico. Nunca exclui conta
// protegida, superadmin, nem a própria conta. Exige digitar o login.
export async function excluirUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const motivo = String(formData.get("motivo") ?? "").trim();
  const confirmLogin = String(formData.get("confirmLogin") ?? "").trim().toLowerCase();
  if (!id) return { ok: false, erro: "Usuário inválido." };
  const db = getDb();
  const alvo = (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!alvo) return { ok: false, erro: "Usuário não encontrado." };

  if (alvo.protectedSuperAdmin) {
    await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.excluir", resultado: "bloqueado", detalhe: "conta protegida" });
    return { ok: false, erro: "Esta conta é protegida e não pode ser excluída." };
  }
  if (id === ator.id) return { ok: false, erro: "Você não pode excluir a si mesmo." };
  if (await ehSuperAdminUsuario(id)) {
    await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.excluir", resultado: "bloqueado", detalhe: "superadmin" });
    return { ok: false, erro: "Remova o superadmin antes de excluir esta conta." };
  }
  if (alvo.deletedAt) return { ok: false, erro: "Conta já excluída." };
  if (confirmLogin !== alvo.username.toLowerCase()) return { ok: false, erro: "Digite o login exatamente para confirmar." };

  await db.update(usuarios).set({
    deletedAt: new Date(),
    deletedBy: ator.username,
    deletionReason: motivo,
    status: "bloqueado",
  }).where(eq(usuarios.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.excluido", detalhe: motivo, antes: "ativo", depois: "excluido" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Restaura uma conta excluída (somente superadmin).
export async function restaurarUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, erro: "Usuário inválido." };
  const alvo = (await getDb().select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
  await getDb().update(usuarios).set({ deletedAt: null, deletedBy: "", deletionReason: "", status: "ativo" }).where(eq(usuarios.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.username, acao: "usuario.restaurado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Alteração de login: SOMENTE superadmin (permissão users.login.update).
export async function alterarLoginUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const novo = String(formData.get("novoLogin") ?? "").trim().toLowerCase();
  if (!id) return { ok: false, erro: "Usuário inválido." };
  if (!validarUsername(novo)) return { ok: false, erro: "Login inválido (mín. 3, letras minúsculas, números, . _ -)." };
  const db = getDb();
  const alvo = (await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1))[0];
  if (!alvo) return { ok: false, erro: "Usuário não encontrado." };
  if (novo === alvo.username) return { ok: true };
  const outro = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, novo)).limit(1))[0];
  if (outro) return { ok: false, erro: "Este login já está em uso." };

  await db.update(usuarios).set({ username: novo }).where(eq(usuarios.id, id));
  await registrarAudit({ ator: ator.username, afetado: novo, acao: "usuario.login_alterado", antes: alvo.username, depois: novo });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export type AuditView = { ator: string; afetado: string; acao: string; resultado: string; detalhe: string; quando: string };
export async function listAuditLogs(limite = 100): Promise<AuditView[]> {
  await exigirSuperAdmin();
  const rows = await getDb().select().from(auditLogs).orderBy(desc(auditLogs.criadoEm)).limit(limite);
  return rows.map((r) => ({ ator: r.ator, afetado: r.afetado, acao: r.acao, resultado: r.resultado, detalhe: r.detalhe, quando: new Date(r.criadoEm).toLocaleString("pt-BR") }));
}
