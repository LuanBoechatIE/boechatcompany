import "server-only";
import { cookies } from "next/headers";
import { and, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession, verifySessionFull } from "@/app/lib/auth";
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
  const sess = await verifySessionFull(c.get(SESSION_COOKIE)?.value);
  if (!sess) return null;
  const username = sess.u;
  // Filtro base (existe sempre): conta excluída/bloqueada não passa. Sem isto,
  // demitir/bloquear alguém não corta a sessão viva dele. Ver C4.
  const filtroBase = and(eq(usuarios.username, username), isNull(usuarios.deletedAt), ne(usuarios.status, "bloqueado"));
  try {
    const u = (await getDb()
      .select({ id: usuarios.id, sessaoVersao: usuarios.sessaoVersao })
      .from(usuarios)
      .where(filtroBase)
      .limit(1))[0];
    if (!u) return null;
    // Revogação de sessão: se o banco foi incrementado (troca de senha/login,
    // bloqueio, exclusão), o token antigo — com a versão velha — não vale mais.
    if (u.sessaoVersao !== sess.v) return null;
    return { id: u.id, username };
  } catch {
    // Tolerância à migração: se a coluna sessao_versao ainda não existe (deploy
    // antes de rodar seguranca-sessao.sql), cai pro filtro sem versão. A
    // proteção crítica (bloqueado/excluído) continua ativa; a revogação por
    // versão liga sozinha assim que a migração rodar. Se o banco estiver fora,
    // esta segunda query também lança e o erro sobe (getPermsAtuais nega tudo).
    const u = (await getDb()
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(filtroBase)
      .limit(1))[0];
    if (!u) return null;
    return { id: u.id, username };
  }
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

// Exige apenas sessão válida (logado), sem permissão específica. Retorna o ator.
//
// ⚠️ Toda Server Action PRECISA de guarda na primeira linha. O middleware NÃO
// protege Server Action: elas são despachadas pelo header `Next-Action` contra
// um manifesto global, não pela rota. Um POST para `/` (rota pública) executa
// qualquer action do app. A barreira tem que estar DENTRO da função.
//
// Use exigirPermissao("...") quando a ação tem permissão própria. Use isto
// apenas para leituras que qualquer usuário autenticado pode fazer.
export async function exigirSessao(): Promise<Ator> {
  const atual = await getUsuarioAtual();
  if (!atual) throw new Error("Não autorizado.");
  return atual;
}

// Como exigirPermissao, mas retorna {id, username} do ator (superadmin sempre
// passa, via temPermissao). Para actions que precisam registrar quem agiu
// (auditoria) sem exigir superadmin binário.
export async function exigirPermissaoAtor(perm: string): Promise<Ator> {
  const atual = await getUsuarioAtual();
  if (!atual) throw new Error("Não autorizado.");
  if (!(await temPermissao(perm))) throw new Error("Sem permissão para esta ação.");
  return atual;
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
