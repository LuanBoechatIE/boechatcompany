import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./app/lib/auth";

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

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/contratos/:path*", "/admin/:path*"],
};
