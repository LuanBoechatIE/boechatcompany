import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, verifySession } from "./app/lib/auth";
import { getDb, dbConfigured } from "./app/lib/db";
import { usuarios } from "./app/lib/db/schema";

const ROTA_PRIMEIRO_ACESSO = "/admin/primeiro-acesso";

// Só consulta o banco (neon-http, roda no edge) se a env estiver configurada
// e devolve false em qualquer erro — nunca trava o acesso por causa disso.
async function precisaTrocarSenha(username: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  try {
    const rows = await getDb()
      .select({ trocar: usuarios.trocaSenhaObrigatoria })
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);
    return rows[0]?.trocar ?? false;
  } catch {
    return false;
  }
}

// Protege as áreas internas: /contratos/* e /admin/*.
// A tela de login e as APIs de login/logout ficam liberadas.
// O onboarding do CLIENTE (/onboarding/[token]) NÃO passa por aqui: é público via token.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthEndpoint =
    pathname === "/contratos/login" || pathname === "/contratos/api/login";
  if (isAuthEndpoint) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/contratos/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    const res = NextResponse.redirect(url);
    // garante que área protegida nunca seja indexada/cacheada
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  if (pathname.startsWith("/admin") && pathname !== ROTA_PRIMEIRO_ACESSO && (await precisaTrocarSenha(user))) {
    const url = req.nextUrl.clone();
    url.pathname = ROTA_PRIMEIRO_ACESSO;
    url.search = "";
    const res = NextResponse.redirect(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/contratos/:path*", "/admin/:path*"],
};
