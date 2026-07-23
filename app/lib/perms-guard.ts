import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { resolverPermissoes } from "@/app/lib/permissoes";

export type PermsAtuais = {
  username: string;
  superAdmin: boolean;
  permissoes: Set<string>;
  has: (perm: string) => boolean;
};

export type Ator = { id: number; username: string };

// Ponto único de "quem está logado agora" (cookie + verifySession + linha em
// `usuarios`). getPermsAtuais, exigirSuperAdmin e getSessaoAtual (sessao.ts)
// consomem isto em vez de reimplementar a query.
export async function getUsuarioAtual(): Promise<Ator | null> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) return null;
  const u = (await getDb().select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, username)).limit(1))[0];
  if (!u) return null;
  return { id: u.id, username };
}

// Permissões do usuário logado (para páginas server e server actions).
// À prova de falha: sem sessão/erro → nega tudo.
export async function getPermsAtuais(): Promise<PermsAtuais | null> {
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) return null;
  try {
    const u = await getUsuarioAtual();
    if (!u) return { username, superAdmin: false, permissoes: new Set(), has: () => false };
    const { superAdmin, permissoes } = await resolverPermissoes(u.id);
    const set = new Set(permissoes);
    return { username, superAdmin, permissoes: set, has: (perm) => superAdmin || set.has(perm) };
  } catch {
    return { username, superAdmin: false, permissoes: new Set(), has: () => false };
  }
}

// Conveniência: true se o usuário atual tem a permissão (ou é superadmin).
export async function temPermissao(perm: string): Promise<boolean> {
  const p = await getPermsAtuais();
  return !!p?.has(perm);
}

// Lança quando o usuário não tem a permissão (para usar em server actions).
export async function exigirPermissao(perm: string): Promise<void> {
  if (!(await temPermissao(perm))) throw new Error("Sem permissão para esta ação.");
}

// Lança quando o usuário não é superadmin. Retorna {id, username} do ator.
// Ponto único: roles-actions.ts e usuarios-actions.ts importam daqui em vez
// de reimplementar cookies+verifySession+resolverPermissoes cada um.
export async function exigirSuperAdmin(): Promise<Ator> {
  const atual = await getUsuarioAtual();
  if (!atual) throw new Error("Não autorizado.");
  const { superAdmin } = await resolverPermissoes(atual.id);
  if (!superAdmin) throw new Error("Acesso restrito a superadministradores.");
  return atual;
}
