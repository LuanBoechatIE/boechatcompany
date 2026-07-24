"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios, cargos, userCargos, roles, userRoles } from "@/app/lib/db/schema";
import { resolverPermissoes } from "@/app/lib/permissoes";
import { exigirSuperAdmin } from "@/app/lib/perms-guard";
import { registrarAudit } from "@/app/lib/audit";

const CFG_PATH = "/admin/configuracoes";

// Defesa em profundidade: mesmo que a UI não liste mais a conta excluída,
// a action não pode confiar só nisso — bloqueia concessão de cargo/permissão
// pra um usuarioId que veio de uma requisição manual contra conta excluída.
async function contaAtiva(usuarioId: number): Promise<boolean> {
  const u = (await getDb().select({ deletedAt: usuarios.deletedAt }).from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1))[0];
  return !!u && !u.deletedAt;
}

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
  rolesAcesso: { id: number; nome: string }[];
};

export async function listUsuariosGestao(): Promise<UsuarioGestao[]> {
  await exigirSuperAdmin();
  const db = getDb();
  // Conta excluída não pode receber cargo/permissão/superadmin nem aparecer
  // aqui — esta lista é sobre atribuição de acesso ativo, não histórico.
  const us = await db.select().from(usuarios).where(isNull(usuarios.deletedAt)).orderBy(asc(usuarios.username));
  const superRole = (await db.select({ id: roles.id }).from(roles).where(eq(roles.chave, "super_admin")).limit(1))[0];

  const out: UsuarioGestao[] = [];
  for (const u of us) {
    const cs = await db
      .select({ id: cargos.id, nome: cargos.nome, cor: cargos.cor })
      .from(userCargos)
      .innerJoin(cargos, eq(userCargos.cargoId, cargos.id))
      .where(eq(userCargos.usuarioId, u.id));
    const rs = await db
      .select({ id: roles.id, nome: roles.nome })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.usuarioId, u.id), eq(roles.sup, false)));
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
      rolesAcesso: rs,
    });
  }
  return out;
}

export async function atribuirCargo(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const cargoId = Number(formData.get("cargoId"));
  if (!usuarioId || !cargoId) return { ok: false, erro: "Dados inválidos." };
  if (!(await contaAtiva(usuarioId))) return { ok: false, erro: "Conta excluída ou inexistente." };
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

  const alvo = (await db.select({ username: usuarios.username, protegido: usuarios.protectedSuperAdmin, deletedAt: usuarios.deletedAt }).from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1))[0];
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
    if (!alvo || alvo.deletedAt) {
      await registrarAudit({ ator: ator.username, afetado: alvoNome, acao: "superadmin.concedido", resultado: "bloqueado", detalhe: "conta excluída ou inexistente" });
      return { ok: false, erro: "Conta excluída ou inexistente." };
    }
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
    if (!(await contaAtiva(usuarioId))) return { ok: false, erro: "Conta excluída ou inexistente." };
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

// ── Cargos de acesso (roles: permissão real por grupo, não confundir com o
// catálogo `cargos` acima, que é só rótulo profissional cosmético) ──────────

export type RoleView = { id: number; chave: string; nome: string; descricao: string; ativo: boolean; qtdUsuarios: number };

// Roles "sup" (super_admin) ficam fora daqui — têm fluxo dedicado e protegido
// em definirSuperAdmin, com proteção de conta protegida e último-superadmin.
export async function listRoles(): Promise<RoleView[]> {
  await exigirSuperAdmin();
  const db = getDb();
  const rs = await db.select().from(roles).where(eq(roles.sup, false)).orderBy(asc(roles.nome));
  const out: RoleView[] = [];
  for (const r of rs) {
    const n = (await db.select({ n: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.roleId, r.id)))[0]?.n ?? 0;
    out.push({ id: r.id, chave: r.chave, nome: r.nome, descricao: r.descricao, ativo: r.ativo, qtdUsuarios: n });
  }
  return out;
}

function chaveDeNome(nome: string): string {
  return nome
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function criarRole(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!nome) return { ok: false, erro: "Informe o nome do cargo." };
  const chave = chaveDeNome(nome);
  if (!chave) return { ok: false, erro: "Nome inválido." };
  const db = getDb();
  const existente = (await db.select({ id: roles.id }).from(roles).where(eq(roles.chave, chave)).limit(1))[0];
  if (existente) return { ok: false, erro: "Já existe um cargo com esse nome." };
  await db.insert(roles).values({ chave, nome, descricao, sup: false, ativo: true });
  await registrarAudit({ ator: ator.username, afetado: chave, acao: "role.criado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function atualizarRole(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, erro: "Cargo inválido." };
  const db = getDb();
  const alvo = (await db.select().from(roles).where(eq(roles.id, id)).limit(1))[0];
  if (!alvo || alvo.sup) return { ok: false, erro: "Cargo inválido." };
  await db.update(roles).set({
    nome: String(formData.get("nome") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim(),
    ativo: String(formData.get("ativo") ?? "true") === "true",
  }).where(eq(roles.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.chave, acao: "role.editado" });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

// Exclui um cargo de acesso. Se houver usuários vinculados, exige `forcar`
// explícito (a UI mostra quantos serão afetados antes de permitir).
export async function excluirRole(formData: FormData): Promise<{ ok: boolean; erro?: string; usuariosAfetados?: number }> {
  const ator = await exigirSuperAdmin();
  const id = Number(formData.get("id"));
  const forcar = String(formData.get("forcar") ?? "") === "true";
  if (!id) return { ok: false, erro: "Cargo inválido." };
  const db = getDb();
  const alvo = (await db.select().from(roles).where(eq(roles.id, id)).limit(1))[0];
  if (!alvo || alvo.sup) return { ok: false, erro: "Cargo inválido." };

  const qtd = (await db.select({ n: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.roleId, id)))[0]?.n ?? 0;
  if (qtd > 0 && !forcar) return { ok: false, erro: `${qtd} conta(s) usam este cargo.`, usuariosAfetados: qtd };

  await db.delete(userRoles).where(eq(userRoles.roleId, id));
  await db.delete(roles).where(eq(roles.id, id));
  await registrarAudit({ ator: ator.username, afetado: alvo.chave, acao: "role.excluido", detalhe: `${qtd} usuário(s) desvinculado(s)` });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function atribuirRoleUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const roleId = Number(formData.get("roleId"));
  if (!usuarioId || !roleId) return { ok: false, erro: "Dados inválidos." };
  if (!(await contaAtiva(usuarioId))) return { ok: false, erro: "Conta excluída ou inexistente." };
  const db = getDb();
  const role = (await db.select({ sup: roles.sup, chave: roles.chave }).from(roles).where(eq(roles.id, roleId)).limit(1))[0];
  // super_admin tem fluxo dedicado (definirSuperAdmin) com proteções extras.
  if (!role || role.sup) return { ok: false, erro: "Use a opção de superadmin pra esse cargo." };
  await db.insert(userRoles).values({ usuarioId, roleId }).onConflictDoNothing();
  await registrarAudit({ ator: ator.username, afetado: String(usuarioId), acao: "role.atribuido", detalhe: role.chave });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export async function removerRoleUsuario(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const roleId = Number(formData.get("roleId"));
  if (!usuarioId || !roleId) return { ok: false, erro: "Dados inválidos." };
  const db = getDb();
  const role = (await db.select({ sup: roles.sup, chave: roles.chave }).from(roles).where(eq(roles.id, roleId)).limit(1))[0];
  if (!role || role.sup) return { ok: false, erro: "Use a opção de superadmin pra esse cargo." };
  await db.delete(userRoles).where(and(eq(userRoles.usuarioId, usuarioId), eq(userRoles.roleId, roleId)));
  await registrarAudit({ ator: ator.username, afetado: String(usuarioId), acao: "role.removido", detalhe: role.chave });
  revalidatePath(CFG_PATH);
  return { ok: true };
}

export type MatrizRoleView = {
  concedidas: string[];
  modulos: { modulo: string; label: string; acoes: { chave: string; label: string }[] }[];
};

export async function getMatrizRole(roleId: number): Promise<MatrizRoleView> {
  await exigirSuperAdmin();
  const { MODULOS_PERMISSOES } = await import("@/app/lib/permissoes");
  const { permissions, rolePermissions } = await import("@/app/lib/db/schema");
  const db = getDb();
  const concedidas = (
    await db.select({ chave: permissions.chave }).from(rolePermissions).innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id)).where(eq(rolePermissions.roleId, roleId))
  ).map((p) => p.chave);
  return { concedidas, modulos: MODULOS_PERMISSOES };
}

// Concede (on) ou remove (off) uma permissão pra TODOS os usuários do cargo,
// via role_permissions. Efeito imediato: quem tem o cargo ganha/perde na hora.
export async function definirPermissaoRole(formData: FormData): Promise<{ ok: boolean; erro?: string }> {
  const ator = await exigirSuperAdmin();
  const roleId = Number(formData.get("roleId"));
  const chave = String(formData.get("chave") ?? "").trim();
  const estado = String(formData.get("estado") ?? "");
  if (!roleId || !chave) return { ok: false, erro: "Dados inválidos." };

  const { permissions, rolePermissions } = await import("@/app/lib/db/schema");
  const db = getDb();
  const role = (await db.select({ sup: roles.sup, chave: roles.chave }).from(roles).where(eq(roles.id, roleId)).limit(1))[0];
  if (!role || role.sup) return { ok: false, erro: "Cargo inválido." };
  const perm = (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.chave, chave)).limit(1))[0];
  if (!perm) return { ok: false, erro: "Permissão desconhecida." };

  if (estado === "on") {
    await db.insert(rolePermissions).values({ roleId, permissionId: perm.id }).onConflictDoNothing();
  } else {
    await db.delete(rolePermissions).where(and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, perm.id)));
  }
  await registrarAudit({ ator: ator.username, afetado: role.chave, acao: estado === "on" ? "role_permissao.concedida" : "role_permissao.removida", detalhe: chave });
  revalidatePath(CFG_PATH);
  return { ok: true };
}
