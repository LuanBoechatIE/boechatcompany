import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./app/lib/auth";

// Protege /contratos/*, exceto a tela de login e a API de login.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isLogin =
    pathname === "/contratos/login" || pathname === "/contratos/api/login";
  if (isLogin) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySession(token);

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/contratos/login";
    url.search = "";
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
  matcher: ["/contratos/:path*"],
};
