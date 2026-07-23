// Ponto único de resolução do usuário logado, pra gestão de equipe comercial.
// Todo módulo que precisa saber "quem é" e "o que essa pessoa pode ver"
// consome getSessaoAtual() em vez de reimplementar cookies()+verifySession().
import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { resolverPermissoes } from "@/app/lib/permissoes";
import { getUsuarioAtual } from "@/app/lib/perms-guard";

export type SessaoUsuario = {
  id: number;
  username: string;
  nome: string;
  superAdmin: boolean;
  // true = Diretor Comercial ou Dono: vê a equipe inteira, pode filtrar por
  // vendedor e reatribuir leads. false = Vendedor: escopo travado no próprio.
  podeVerEquipe: boolean;
  podeReatribuir: boolean;
};

export async function getSessaoAtual(): Promise<SessaoUsuario | null> {
  let atual = await getUsuarioAtual();
  if (!atual) {
    // getUsuarioAtual não auto-provisiona; sessao.ts é o ponto de entrada da
    // área comercial (primeiro módulo acessado após login), então provisiona
    // aqui e tenta de novo.
    const c = await cookies();
    const username = await verifySession(c.get(SESSION_COOKIE)?.value);
    if (!username) return null;
    await getDb()
      .insert(usuarios)
      .values({ username, nomeCompleto: username })
      .onConflictDoNothing({ target: usuarios.username });
    atual = await getUsuarioAtual();
    if (!atual) return null;
  }

  const rows = await getDb().select({ nomeCompleto: usuarios.nomeCompleto }).from(usuarios).where(eq(usuarios.id, atual.id)).limit(1);
  const perms = await resolverPermissoes(atual.id);
  const podeVerEquipe = perms.superAdmin || perms.permissoes.includes("equipe.visualizar_tudo");
  const podeReatribuir = perms.superAdmin || perms.permissoes.includes("leads.reatribuir");

  return {
    id: atual.id,
    username: atual.username,
    nome: rows[0]?.nomeCompleto || atual.username,
    superAdmin: perms.superAdmin,
    podeVerEquipe,
    podeReatribuir,
  };
}
