import "server-only";
import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { usuarios } from "@/app/lib/db/schema";

// Geradores de login e senha temporária. Lógica PURA, fora de "use server":
// as versões expostas como Server Action (em usuarios-actions.ts) são wrappers
// com guarda de sessão. Outras actions server-side (ex: contratarCandidatura,
// já protegida por exigirSuperAdmin) importam estas versões puras direto,
// sem repassar por uma checagem de permissão que não é a delas. Ver A7/C1.

const DOMINIO_LOGIN = "boechat.com";

// Senha temporária legível (com letra e número, atende aos requisitos).
// randomInt (crypto nativo) em vez de Math.random: previsível o suficiente
// pra ser explorado, o que é inaceitável pra uma senha, ainda que temporária.
export function gerarSenhaTemporariaPura(): string {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const nums = "23456789";
  const todos = letras + nums;
  let s = letras[randomInt(letras.length)] + nums[randomInt(nums.length)];
  for (let i = 0; i < 8; i++) s += todos[randomInt(todos.length)];
  return s;
}

function normalizarParteNome(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Gera um login único no padrão nome@boechat.com a partir do nome completo.
// Ordem: primeironome@ -> primeironome.sobrenome@ -> primeironome2@, 3@...
export async function gerarLoginUnicoPuro(nomeCompleto: string): Promise<string> {
  const partes = nomeCompleto.trim().split(/\s+/).filter(Boolean).map(normalizarParteNome).filter(Boolean);
  const primeiro = partes[0] || "usuario";
  const sobrenome = partes.length > 1 ? partes[partes.length - 1] : "";
  const db = getDb();

  async function livre(login: string): Promise<boolean> {
    const existe = (await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.username, login)).limit(1))[0];
    return !existe;
  }

  const base = `${primeiro}@${DOMINIO_LOGIN}`;
  if (await livre(base)) return base;

  if (sobrenome) {
    const comSobrenome = `${primeiro}.${sobrenome}@${DOMINIO_LOGIN}`;
    if (await livre(comSobrenome)) return comSobrenome;
  }

  for (let n = 2; n <= 999; n++) {
    const candidato = `${primeiro}${n}@${DOMINIO_LOGIN}`;
    if (await livre(candidato)) return candidato;
  }
  return base; // praticamente inalcançável (>999 colisões do mesmo primeiro nome)
}
