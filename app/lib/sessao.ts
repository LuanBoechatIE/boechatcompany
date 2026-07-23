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
  const c = await cookies();
  const username = await verifySession(c.get(SESSION_COOKIE)?.value);
  if (!username) return null;

  const db = getDb();
  let rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
  if (rows.length === 0) {
    // Auto-provisiona (mesmo padrão de getPerfilAtual) — garante que toda
    // sessão válida tenha uma linha real em `usuarios` pra ownership/permissões.
    await db
      .insert(usuarios)
      .values({ username, nomeCompleto: username })
      .onConflictDoNothing({ target: usuarios.username });
    rows = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
  }
  const u = rows[0];
  if (!u) return null;

  const perms = await resolverPermissoes(u.id);
  const podeVerEquipe = perms.superAdmin || perms.permissoes.includes("equipe.visualizar_tudo");
  const podeReatribuir = perms.superAdmin || perms.permissoes.includes("leads.reatribuir");

  return {
    id: u.id,
    username: u.username,
    nome: u.nomeCompleto || u.username,
    superAdmin: perms.superAdmin,
    podeVerEquipe,
    podeReatribuir,
  };
}
