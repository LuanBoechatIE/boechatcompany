// Callback do OAuth do Google. Valida o `state` (CSRF), troca o código pelos
// tokens, guarda a conexão com tokens CRIPTOGRAFADOS e volta pro calendário.
// Tokens nunca são logados nem enviados ao frontend.
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { googleCalendarConnections } from "@/app/lib/db/schema";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { encrypt } from "@/app/lib/crm/crypto";
import { trocarCodigoPorTokens, emailDaConta } from "@/app/lib/google/oauth";
import { STATE_COOKIE } from "../start/route";

function voltar(req: NextRequest, status: string): NextResponse {
  const res = NextResponse.redirect(
    new URL(`/admin/crm/calendario?google=${status}`, req.url),
  );
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erro = url.searchParams.get("error");
  const stateCookie = req.cookies.get(STATE_COOKIE)?.value;

  if (erro) return voltar(req, "cancelado");
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return voltar(req, "estado_invalido");
  }

  const quem = (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) ?? "desconhecido";

  try {
    const tokens = await trocarCodigoPorTokens(code);
    const email = tokens.accessToken ? await emailDaConta(tokens.accessToken) : "";
    const db = getDb();

    // Modelo single-org: reaproveita a conexão existente (se houver).
    const existentes = await db
      .select()
      .from(googleCalendarConnections)
      .orderBy(desc(googleCalendarConnections.id))
      .limit(1);
    const atual = existentes[0];

    const valores = {
      googleAccountEmail: email,
      calendarId: atual?.calendarId || "primary",
      encryptedAccessToken: tokens.accessToken ? encrypt(tokens.accessToken) : "",
      // Se o Google não devolver refresh token (reconsentimento), mantém o antigo.
      encryptedRefreshToken: tokens.refreshToken
        ? encrypt(tokens.refreshToken)
        : atual?.encryptedRefreshToken ?? "",
      tokenExpiresAt: tokens.expiryDate ? new Date(tokens.expiryDate) : null,
      scopes: tokens.scope,
      syncToken: "", // força sync inicial completa
      status: "conectado",
      connectedBy: quem,
      atualizadoEm: new Date(),
    };

    if (atual) {
      await db
        .update(googleCalendarConnections)
        .set(valores)
        .where(eq(googleCalendarConnections.id, atual.id));
    } else {
      await db.insert(googleCalendarConnections).values(valores);
    }

    return voltar(req, "conectado");
  } catch {
    // Sem detalhes/tokens na URL nem em logs.
    return voltar(req, "falha");
  }
}
