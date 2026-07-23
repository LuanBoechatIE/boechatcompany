"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, cargos, userCargos, roles, userRoles } from "@/app/lib/db/schema";
import { resolverPermissoes } from "@/app/lib/permissoes";
import { exigirSuperAdmin } from "@/app/lib/perms-guard";
import { registrarAudit } from "@/app/lib/audit";

const CFG_PATH = "/admin/configuracoes";

// ── Cargos (catálogo) ────────────────────────────────────────────────────────

export type CargoView = { id: number; nome: string; cor: string; ativo: boolean };

export async function listCargos(): Promise<CargoView[]> {
  return getDb().select().from(cargos).orderBy(asc(cargos.nome));
}

export async function criarCargo(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "#a78bfa").trim();
  if (!nome) return { ok: false, erro: "Informe o nome do cargo." };
  try {
    await getDb().insert(cargos).values({ nome, cor }).onConflictDoNothing({ target: cargos.nome });
  } catch {
    return { ok: false, erro: "Não foi possível criar o cargo." };
  }
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function atualizarCargo(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, erro: "Cargo inválido." };
  await getDb()
    .update(cargos)
    .set({
      nome: String(formData.get("nome") ?? "").trim(),
      cor: String(formData.get("cor") ?? "#a78bfa").trim(),
      ativo: String(formData.get("ativo") ?? "true") === "true",
    })
    .where(eq(cargos.id, id));
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// ── Usuários: cargos e superadmin ────────────────────────────────────────────

export type UsuarioGestao = {
  id: number;
  username: string;
  nome: string;
  foto: string;
  status: string;
  superAdmin: boolean;
  protegido: boolean;
  cargos: { id: number; nome: string; cor: string }[];
};

export async function listUsuariosGestao(): Promise<UsuarioGestao[]> {
  await exigirSuperAdmin();
  const db = getDb();
  const us = await db.select().from(usuarios).orderBy(asc(usuarios.username));
  const superRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];

  const out: UsuarioGestao[] = [];
  for (const u of us) {
    const cs = await db
      .select({ id: cargos.id, nome: cargos.nome, cor: cargos.cor })
      .from(userCargos)
      .innerJoin(cargos, eq(userCargos.cargoId, cargos.id))
      .where(eq(userCargos.usuarioId, u.id));
    const sup = superRole
      ? (await db.select({ id: userRoles.id }).from(userRoles).where(and(eq(userRoles.usuarioId, u.id), eq(userRoles.roleId, superRole.id))).limit(1)).length > 0
      : false;
    out.push({
      id: u.id,
      username: u.username,
      nome: u.nomeCompleto || u.username,
      foto: u.foto,
      status: u.status,
      superAdmin: sup,
      protegido: u.protectedSuperAdmin,
      cargos: cs,
    });
  }
  return out;
}

export async function atribuirCargo(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const cargoId = Number(formData.get("cargoId"));
  if (!usuarioId || !cargoId) return { ok: false, erro: "Dados inválidos." };
  await getDb().insert(userCargos).values({ usuarioId, cargoId }).onConflictDoNothing();
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function removerCargo(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const cargoId = Number(formData.get("cargoId"));
  await getDb().delete(userCargos).where(and(eq(userCargos.usuarioId, usuarioId), eq(userCargos.cargoId, cargoId)));
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Concede/remove super_admin, protegendo contra ficar sem nenhum superadmin.
export async function definirSuperAdmin(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const ativar = String(formData.get("ativar") ?? "") === "true";
  if (!usuarioId) return { ok: false, erro: "Usuário inválido." };
  const db = getDb();
  const superRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];
  if (!superRole) return { ok: false, erro: "Role super_admin não encontrada." };

  const alvo = (await db.select({ username: usuarios.username, protegido: usuarios.protectedSuperAdmin }).from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1))[0];
  const alvoNome = alvo?.username ?? String(usuarioId);

  if (!ativar) {
    // Conta protegida (Samuel/Luan): nunca perde o superadmin.
    if (alvo?.protegido) {
      await registrarAudit({ ator: ator.username, afetado: alvoNome, acao: "superadmin.remover", resultado: "bloqueado", detalhe: "conta protegida" });
      return { ok: false, erro: "Esta conta é protegida: o superadministrador não pode ser removido." };
    }
    // Não permitir remover o último superadmin ativo.
    const total = (await db.select({ n: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.roleId, superRole.id)))[0]?.n ?? 0;
    if (total <= 1) return { ok: false, erro: "Não é possível remover o último superadministrador." };
    if (usuarioId === ator.id) return { ok: false, erro: "Você não pode remover o seu próprio último acesso de superadmin." };
    await db.delete(userRoles).where(and(eq(userRoles.usuarioId, usuarioId), eq(userRoles.roleId, superRole.id)));
    await registrarAudit({ ator: ator.username, afetado: alvoNome, acao: "superadmin.removido" });
  } else {
    await db.insert(userRoles).values({ usuarioId, roleId: superRole.id }).onConflictDoNothing();
    await registrarAudit({ ator: ator.username, afetado: alvoNome, acao: "superadmin.concedido" });
  }
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// ── Matriz de permissões por usuário (concessão pontual sem ser superadmin) ──
export type MatrizPermissoesView = {
  superAdmin: boolean;
  concedidas: string[];
  modulos: { modulo: string; label: string; acoes: { chave: string; label: string }[] }[];
};

export async function getMatrizPermissoes(usuarioId: number): Promise<MatrizPermissoesView> {
  await exigirSuperAdmin();
  const { MODULOS_PERMISSOES } = await import("@/app/lib/permissoes");
  const { superAdmin, permissoes } = await resolverPermissoes(usuarioId);
  return { superAdmin, concedidas: permissoes, modulos: MODULOS_PERMISSOES };
}

// Concede (on) ou remove (off) uma permissão individual do usuário via
// user_permission_overrides. Não altera cargos nem roles.
export async function definirPermissaoUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const chave = String(formData.get("chave") ?? "").trim();
  const estado = String(formData.get("estado") ?? "");
  if (!usuarioId || !chave) return { ok: false, erro: "Dados inválidos." };

  const { permissions, userPermissionOverrides } = await import("@/app/lib/db/schema");
  const { registrarAudit } = await import("@/app/lib/audit");
  const db = getDb();
  const perm = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.chave, chave)).limit(1))[0];
  if (!perm) return { ok: false, erro: "Permissão desconhecida." };

  if (estado === "on") {
    await db
      .insert(userPermissionOverrides)
      .values({ usuarioId, permissionId: perm.id, permitido: true })
      .onConflictDoUpdate({ target: [userPermissionOverrides.usuarioId, userPermissionOverrides.permissionId], set: { permitido: true } });
  } else {
    await db.delete(userPermissionOverrides).where(and(eq(userPermissionOverrides.usuarioId, usuarioId), eq(userPermissionOverrides.permissionId, perm.id)));
  }
  await registrarAudit({ ator: ator.username, afetado: String(usuarioId), acao: estado === "on" ? "permissao.concedida" : "permissao.removida", detalhe: chave });
  revalidatePath(CFG_PATH);
  return { ok: true };
}
