import "server-only";
import { getDb } from "@/app/lib/db";
import { auditLogs } from "@/app/lib/db/schema";
import { ipDoPedido } from "@/app/lib/rate-limit";

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
  /** Origem do pedido. Num incidente é a primeira pergunta que se faz. */
  ip?: string;
  userAgent?: string;
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
      ip: entrada.ip || "",
      // Cortado: user agent é texto que o cliente escolhe, e não há motivo
      // pra guardar quilobyte de string arbitrária por tentativa de login.
      userAgent: (entrada.userAgent || "").slice(0, 300),
    });
  } catch {
    // silencioso: auditoria nunca quebra a operação
  }
}

/** Origem do pedido, no formato que registrarAudit espera. */
export function origemDoPedido(cabecalhos: Headers): { ip: string; userAgent: string } {
  return {
    ip: ipDoPedido(cabecalhos),
    userAgent: cabecalhos.get("user-agent") ?? "",
  };
}
