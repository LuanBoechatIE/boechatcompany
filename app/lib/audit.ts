import "server-only";
import { getDb } from "@/app/lib/db";
import { auditLogs } from "@/app/lib/db/schema";

// Registra uma ação sensível. Nunca recebe senha/hash/token/segredo.
// À prova de falha: um erro de auditoria não deve derrubar a ação principal.
export async function registrarAudit(entrada: {
  ator: string;
  afetado?: string;
  acao: string;
  resultado?: "ok" | "bloqueado" | "erro";
  detalhe?: string;
  antes?: string;
  depois?: string;
}): Promise<void> {
  try {
    await getDb().insert(auditLogs).values({
      ator: entrada.ator || "",
      afetado: entrada.afetado || "",
      acao: entrada.acao,
      resultado: entrada.resultado || "ok",
      detalhe: entrada.detalhe || "",
      antes: entrada.antes || "",
      depois: entrada.depois || "",
    });
  } catch {
    // silencioso: auditoria nunca quebra a operação
  }
}
