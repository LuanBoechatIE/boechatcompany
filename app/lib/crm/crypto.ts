import "server-only";
import crypto from "node:crypto";

// Criptografia dos segredos de integração (tokens/credenciais).
// AES-256-GCM com chave derivada de INTEGRATIONS_SECRET (env, só no backend).
// Fail-closed: sem a env var, não dá pra salvar nem ler segredos.

const ALGO = "aes-256-gcm";

export function cryptoConfigured(): boolean {
  return Boolean(process.env.INTEGRATIONS_SECRET);
}

function getKey(): Buffer {
  const raw = process.env.INTEGRATIONS_SECRET;
  if (!raw) throw new Error("INTEGRATIONS_SECRET não configurado.");
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  if (!payload) return "";
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// Objeto de segredos -> blob criptografado, e volta.
export function encryptSecrets(obj: Record<string, string>): string {
  return encrypt(JSON.stringify(obj));
}

export function decryptSecrets(payload: string): Record<string, string> {
  if (!payload) return {};
  try {
    return JSON.parse(decrypt(payload)) as Record<string, string>;
  } catch {
    return {};
  }
}

// Máscara pra exibição: mostra só os 4 últimos caracteres.
export function mask(v: string): string {
  if (!v) return "";
  const last = v.slice(-4);
  return "••••••••••••" + last;
}
