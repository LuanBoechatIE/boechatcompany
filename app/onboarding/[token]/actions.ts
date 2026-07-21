"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { clientes, presets, respostas } from "@/app/lib/db/schema";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

export type SubmitState = { status: "idle" | "ok" | "erro"; msg?: string };

export async function submitOnboarding(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const token = String(formData.get("__token") ?? "");
  if (!token) return { status: "erro", msg: "Link inválido." };

  const db = getDb();
  const cRows = await db
    .select()
    .from(clientes)
    .where(eq(clientes.token, token))
    .limit(1);
  const cliente = cRows[0];
  if (!cliente) return { status: "erro", msg: "Link inválido ou expirado." };

  // Trava de envio único: só aceita se ainda não respondeu (ou foi reaberto).
  if (cliente.status === "respondido") {
    return { status: "erro", msg: "Este onboarding já foi respondido." };
  }

  const pRows = await db
    .select()
    .from(presets)
    .where(eq(presets.id, cliente.presetId))
    .limit(1);
  const campos = (pRows[0]?.campos as FieldDef[]) ?? [];

  const valores: RespostaValores = {};
  for (const campo of campos) {
    const raw = formData.get(`campo_${campo.id}`);
    valores[campo.id] = raw == null ? "" : String(raw).slice(0, 5000);
  }

  const faltando = campos.filter((c) => c.obrigatorio && !valores[c.id]?.trim());
  if (faltando.length > 0) {
    return {
      status: "erro",
      msg: "Preencha os campos obrigatórios: " + faltando.map((f) => f.label).join(", "),
    };
  }

  await db
    .insert(respostas)
    .values({ clienteId: cliente.id, valores })
    .onConflictDoUpdate({
      target: respostas.clienteId,
      set: { valores, enviadoEm: new Date() },
    });

  await db
    .update(clientes)
    .set({ status: "respondido", respondidoEm: new Date() })
    .where(eq(clientes.id, cliente.id));

  revalidatePath(`/onboarding/${token}`);
  return { status: "ok" };
}
