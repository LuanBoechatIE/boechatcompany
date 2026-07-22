import "server-only";
import { OAuth2Client } from "google-auth-library";

// Fluxo OAuth 2.0 oficial do Google (aplicação web) para o Google Calendar.
// Client ID/Secret e redirect URI vêm SÓ de variáveis de ambiente.
// Tokens nunca vão pro frontend; o refresh token é guardado criptografado.

// Escopos mínimos: ver/criar/editar/excluir eventos e gerenciar convidados/Meet.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function faltandoGoogleEnv(): string[] {
  return ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"].filter(
    (v) => !process.env[v],
  );
}

export function novoOAuthClient(): OAuth2Client {
  if (!googleConfigured()) {
    throw new Error("Google OAuth não configurado (variáveis de ambiente).");
  }
  return new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
}

// URL de consentimento. `state` protege contra CSRF (validado no callback).
// `access_type=offline` + `prompt=consent` garantem o refresh token.
export function urlDeAutorizacao(state: string): string {
  return novoOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    include_granted_scopes: true,
    state,
  });
}

export type TokensGoogle = {
  accessToken: string;
  refreshToken: string;
  expiryDate: number | null; // epoch ms
  scope: string;
};

// Troca o código de autorização pelos tokens.
export async function trocarCodigoPorTokens(code: string): Promise<TokensGoogle> {
  const client = novoOAuthClient();
  const { tokens } = await client.getToken(code);
  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? "",
    expiryDate: tokens.expiry_date ?? null,
    scope: tokens.scope ?? GOOGLE_SCOPES.join(" "),
  };
}

// Descobre o e-mail da conta conectada a partir do access token.
export async function emailDaConta(accessToken: string): Promise<string> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const json = (await res.json()) as { email?: string };
    return json.email ?? "";
  } catch {
    return "";
  }
}
