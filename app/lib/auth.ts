// Autenticação simples pra área de contratos (2 usuários fixos).
// Sem Supabase: credenciais e segredo ficam em variáveis de ambiente (Vercel),
// nunca no bundle do cliente nem no repositório.
//
// Vars necessárias (definir na Vercel e no .env.local pra dev):
//   SESSION_SECRET   -> string longa e aleatória (assina o cookie de sessão)
//   CONTRATOS_USERS  -> JSON: [{"u":"luan","p":"senha1"},{"u":"samuel","p":"senha2"}]
//
// ⚠️ Fail-closed: se as vars não estiverem setadas, NENHUM login é aceito.

export const SESSION_COOKIE = "boechat_contratos_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type User = { u: string; p: string };

function getUsers(): User[] {
  try {
    const raw = process.env.CONTRATOS_USERS;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x?.u === "string" && typeof x?.p === "string");
  } catch {
    return [];
  }
}

/** Valida usuário+senha contra CONTRATOS_USERS. Fail-closed. */
export function checkCredentials(username: string, password: string): boolean {
  const users = getUsers();
  let ok = false;
  for (const user of users) {
    // compara os dois sempre, pra não vazar tempo
    const uMatch = timingSafeEqual(user.u, username);
    const pMatch = timingSafeEqual(user.p, password);
    if (uMatch && pMatch) ok = true;
  }
  return ok;
}

/** Cria um token de sessão assinado (payload.assinatura). */
export async function createSession(username: string): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ u: username, exp })));
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

/** Verifica o token. Retorna o usuário ou null. */
export async function verifySession(token: string | undefined): Promise<string | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(secret, payload);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (typeof data.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    return typeof data.u === "string" ? data.u : null;
  } catch {
    return null;
  }
}
