import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";
import { checkCredentials } from "@/app/lib/auth";

// Hash de senha com scrypt (nativo do Node, sem dependência nova).
// Formato armazenado: "saltHex:hashHex".
export function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(senha, salt, 64);
  return `${salt.toString("hex")}:${dk.toString("hex")}`;
}

export function conferirHash(senha: string, guardado: string): boolean {
  const [saltHex, hashHex] = guardado.split(":");
  if (!saltHex || !hashHex) return false;
  const dk = scryptSync(senha, Buffer.from(saltHex, "hex"), 64);
  const alvo = Buffer.from(hashHex, "hex");
  return dk.length === alvo.length && timingSafeEqual(dk, alvo);
}

// Verificação de senha aditiva e à prova de falhas:
// 1) se houver hash no banco pro usuário, usa ele;
// 2) senão, cai no CONTRATOS_USERS (env) — comportamento atual;
// 3) qualquer erro de banco também cai no env, pra nunca travar o login.
export async function verificarSenha(username: string, senha: string): Promise<boolean> {
  try {
    const rows = await getDb()
      .select({ senhaHash: usuarios.senhaHash, status: usuarios.status, deletedAt: usuarios.deletedAt })
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);
    const row = rows[0];
    // Conta excluída (soft delete) ou bloqueada não loga.
    if (row?.deletedAt) return false;
    if (row?.status === "bloqueado") return false;
    if (row?.senhaHash) return conferirHash(senha, row.senhaHash);
  } catch {
    // ignora e cai no fallback
  }
  return checkCredentials(username, senha);
}
