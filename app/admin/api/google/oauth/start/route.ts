// Início do fluxo OAuth do Google Calendar.
// Fica sob /admin/* → o middleware já exige sessão de admin (só quem está
// logado consegue iniciar). Gera um `state` aleatório, guarda em cookie
// httpOnly e redireciona pro consentimento oficial do Google.
import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { googleConfigured, urlDeAutorizacao } from "@/app/lib/google/oauth";

export const STATE_COOKIE = "google_oauth_state";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!googleConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/crm/calendario?google=nao_configurado", req.url),
    );
  }

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(urlDeAutorizacao(state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min
  });
  return res;
}
