import "server-only";
import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import {
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userPermissionOverrides,
} from "@/app/lib/db/schema";

// Usuários que recebem super_admin no primeiro acesso (bootstrap inicial).
// Configurável por env; não fica hardcoded em componentes de interface.
export function adminsIniciais(): string[] {
  const raw = process.env.SUPERADMIN_USERS ?? "samuel,luan";
  return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function ehAdminInicial(username: string): boolean {
  return adminsIniciais().includes(username.trim().toLowerCase());
}

export type PermsResolvidas = { superAdmin: boolean; permissoes: string[] };

// Resolve as permissões efetivas de um usuário:
// super_admin => todas; senão união das roles + overrides individuais.
// À prova de falha: sem tabelas/erro de banco, retorna vazio (nega tudo).
export async function resolverPermissoes(usuarioId: number): Promise<PermsResolvidas> {
  try {
    const db = getDb();
    const rs = await db
      .select({ id: roles.id, sup: roles.sup, ativo: roles.ativo })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.usuarioId, usuarioId));

    const superAdmin = rs.some((r) => r.sup && r.ativo);
    if (superAdmin) {
      const todas = await db.select({ chave: permissions.chave }).from(permissions);
      return { superAdmin: true, permissoes: todas.map((p) => p.chave) };
    }

    const roleIds = rs.filter((r) => r.ativo).map((r) => r.id);
    const chaves = new Set<string>();
    if (roleIds.length > 0) {
      const perms = await db
        .select({ chave: permissions.chave })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(inArray(rolePermissions.roleId, roleIds));
      for (const p of perms) chaves.add(p.chave);
    }

    // Overrides individuais (grant/deny) sobrepõem as roles.
    const overrides = await db
      .select({ chave: permissions.chave, permitido: userPermissionOverrides.permitido })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
      .where(eq(userPermissionOverrides.usuarioId, usuarioId));
    for (const o of overrides) {
      if (o.permitido) chaves.add(o.chave);
      else chaves.delete(o.chave);
    }

    return { superAdmin: false, permissoes: [...chaves] };
  } catch {
    return { superAdmin: false, permissoes: [] };
  }
}

// Catálogo de módulos/permissões pra exibição na interface admin.
export const MODULOS_PERMISSOES: { modulo: string; label: string; acoes: { chave: string; label: string }[] }[] = [
  { modulo: "dashboard", label: "Dashboard", acoes: [{ chave: "dashboard.visualizar", label: "Visualizar" }] },
  { modulo: "leads", label: "Leads", acoes: [
    { chave: "leads.visualizar", label: "Visualizar" }, { chave: "leads.criar", label: "Criar" },
    { chave: "leads.editar", label: "Editar" }, { chave: "leads.excluir", label: "Excluir" }, { chave: "leads.exportar", label: "Exportar" },
    { chave: "leads.reatribuir", label: "Reatribuir responsável" }] },
  { modulo: "equipe", label: "Equipe comercial", acoes: [
    { chave: "equipe.visualizar_tudo", label: "Ver leads e métricas de toda a equipe" }] },
  { modulo: "clientes", label: "Clientes", acoes: [
    { chave: "clientes.visualizar", label: "Visualizar" }, { chave: "clientes.criar", label: "Criar" },
    { chave: "clientes.editar", label: "Editar" }, { chave: "clientes.arquivar", label: "Arquivar" }, { chave: "clientes.excluir", label: "Excluir" }] },
  { modulo: "financeiro", label: "Financeiro", acoes: [
    { chave: "financeiro.visualizar", label: "Visualizar" }, { chave: "financeiro.editar", label: "Editar" }, { chave: "financeiro.exportar", label: "Exportar" }] },
  { modulo: "projetos", label: "Projetos", acoes: [
    { chave: "projetos.visualizar", label: "Visualizar" }, { chave: "projetos.criar", label: "Criar" },
    { chave: "projetos.editar", label: "Editar" }, { chave: "projetos.excluir", label: "Excluir" }] },
  { modulo: "demandas", label: "Demandas", acoes: [
    { chave: "demandas.visualizar", label: "Visualizar" }, { chave: "demandas.criar", label: "Criar" },
    { chave: "demandas.editar", label: "Editar" }, { chave: "demandas.excluir", label: "Excluir" }] },
  { modulo: "estrategia", label: "Estratégia", acoes: [
    { chave: "estrategia.visualizar", label: "Visualizar" }, { chave: "estrategia.editar", label: "Editar" }] },
  { modulo: "trafego", label: "Tráfego", acoes: [
    { chave: "trafego.visualizar", label: "Visualizar" }, { chave: "trafego.configurar", label: "Configurar integrações" }, { chave: "trafego.exportar", label: "Exportar" }] },
  { modulo: "calendario", label: "Calendário", acoes: [
    { chave: "calendario.visualizar", label: "Visualizar" }, { chave: "calendario.criar", label: "Criar eventos" },
    { chave: "calendario.editar", label: "Editar eventos" }, { chave: "calendario.excluir", label: "Excluir eventos" }] },
  { modulo: "usuarios", label: "Usuários", acoes: [
    { chave: "usuarios.visualizar", label: "Visualizar" }, { chave: "usuarios.criar", label: "Criar" },
    { chave: "usuarios.editar", label: "Editar" }, { chave: "usuarios.bloquear", label: "Bloquear" },
    { chave: "usuarios.redefinir_senha", label: "Redefinir senha" }, { chave: "usuarios.gerenciar_permissoes", label: "Gerenciar permissões" }] },
];
