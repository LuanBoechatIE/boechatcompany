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

// Versão de sessão atual do usuário, pra embutir no token no login (C4).
// Default 1 quando não há linha ainda ou o banco falha: é o mesmo default da
// coluna, então um token novo bate com qualquer linha real recém-criada.
export async function sessaoVersaoDe(username: string): Promise<number> {
  try {
    const rows = await getDb()
      .select({ v: usuarios.sessaoVersao })
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);
    return rows[0]?.v ?? 1;
  } catch {
    return 1;
  }
}

// Verificação de senha aditiva e à prova de falhas:
// 1) se houver hash no banco pro usuário, usa ele;
// 2) senão, cai no CONTRATOS_USERS (env) — comportamento atual;
// 3) qualquer erro de banco também cai no env, pra nunca travar o login.
export async function verificarSenha(username: string, senha: string): Promise<boolean> {
  let row: { senhaHash: string | null; status: string | null; deletedAt: Date | null } | undefined;
  try {
    const rows = await getDb()
      .select({ senhaHash: usuarios.senhaHash, status: usuarios.status, deletedAt: usuarios.deletedAt })
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);
    row = rows[0];
  } catch (e) {
    // Fail-CLOSED: erro de banco numa decisão de autenticação nega o acesso.
    // Antes isto caía no fallback de env (fail-open), o que apagava as
    // checagens de bloqueado/excluído e comparava senha em texto puro. Ver A4.
    console.error("[auth] erro ao consultar usuario no login:", e instanceof Error ? e.message : e);
    return false;
  }
  // Conta excluída (soft delete) ou bloqueada não loga.
  if (row?.deletedAt) return false;
  if (row?.status === "bloqueado") return false;
  if (row?.senhaHash) return conferirHash(senha, row.senhaHash);
  // Só cai no fallback de env quando a consulta teve SUCESSO e não achou linha
  // (ou a linha não tem hash ainda). Nunca por erro de banco.
  return checkCredentials(username, senha);
}
