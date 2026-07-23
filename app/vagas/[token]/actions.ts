"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { vagas, presets, candidaturas, candidaturaRespostas } from "@/app/lib/db/schema";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

export type SubmitState = { status: "idle" | "ok" | "erro"; msg?: string };

// Diferente do onboarding (que atualiza um `cliente` pré-criado), aqui cada
// envio CRIA a candidatura na hora — não existe rascunho anterior a salvar.
export async function submitCandidatura(
  _prev: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const token = String(formData.get("__token") ?? "");
  if (!token) return { status: "erro", msg: "Link inválido." };

  const db = getDb();
  const vRows = await db.select().from(vagas).where(eq(vagas.token, token)).limit(1);
  const vaga = vRows[0];
  if (!vaga) return { status: "erro", msg: "Vaga não encontrada." };
  if (vaga.status !== "aberta") {
    return { status: "erro", msg: "Esta vaga não está mais recebendo candidaturas." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome) return { status: "erro", msg: "Informe seu nome." };
  if (!email) return { status: "erro", msg: "Informe seu e-mail." };
  if (!telefone) return { status: "erro", msg: "Informe seu telefone." };

  const campos = vaga.presetId
    ? ((await db.select().from(presets).where(eq(presets.id, vaga.presetId)).limit(1))[0]?.campos as
        | FieldDef[]
        | undefined) ?? []
    : [];

  const valores: RespostaValores = {};
  for (const campo of campos) {
    const raw = formData.get(`campo_${campo.id}`);
    valores[campo.id] = raw == null ? "" : String(raw).slice(0, 5000);
  }

  const faltando = campos.filter((c) => c.obrigatorio && !valores[c.id]?.trim());
  if (faltando.length > 0) {
    return {
      status: "erro",
      msg: "Preencha também: " + faltando.map((f) => f.label).join(", "),
    };
  }

  const rows = await db
    .insert(candidaturas)
    .values({ vagaId: vaga.id, nome, email, telefone })
    .returning({ id: candidaturas.id });
  const candidaturaId = rows[0]?.id;
  if (candidaturaId) {
    await db.insert(candidaturaRespostas).values({ candidaturaId, valores });
  }

  return { status: "ok" };
}
