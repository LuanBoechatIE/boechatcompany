import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import type { FieldDef, FieldType } from "@/app/lib/onboarding/types";

// Helpers de preset compartilhados entre o construtor de onboarding e o de
// vagas. Ficam FORA de qualquer arquivo "use server" de propósito: em arquivo
// "use server", todo `export` vira Server Action pública, invocável sem login
// (ver A7 da auditoria). Aqui não: são só funções importadas pelas actions,
// que aplicam a permissão antes de chamar.

const TIPOS_VALIDOS: FieldType[] = [
  "texto",
  "textarea",
  "select",
  "sim_nao",
  "numero",
  "data",
  "link",
  "arquivo",
];

export function parseCampos(raw: string): FieldDef[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (f) =>
          f &&
          typeof f.id === "string" &&
          typeof f.label === "string" &&
          f.label.trim(),
      )
      .map((f): FieldDef => {
        const tipo: FieldType = TIPOS_VALIDOS.includes(f.tipo) ? f.tipo : "texto";
        const opcoes =
          tipo === "select" && Array.isArray(f.opcoes)
            ? f.opcoes.map(String).map((s: string) => s.trim()).filter(Boolean)
            : undefined;
        return {
          id: String(f.id),
          label: String(f.label).trim().slice(0, 300),
          tipo,
          obrigatorio: Boolean(f.obrigatorio),
          opcoes,
          ajuda: f.ajuda ? String(f.ajuda).trim().slice(0, 500) : undefined,
        };
      });
  } catch {
    return [];
  }
}

// Compartilhado entre o construtor de formulário do onboarding e o de vagas
// (Recrutamento) — os dois usam a MESMA tabela `presets`, só o `escopo` muda.
// A checagem de permissão é do CHAMADOR (createPreset/updatePreset).
export async function salvarPreset(
  formData: FormData,
  escopo: "onboarding" | "recrutamento",
): Promise<number | null> {
  const id = Number(formData.get("id")) || null;
  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const campos = parseCampos(String(formData.get("campos") ?? "[]"));
  if (!nome) return null;
  if (id) {
    await getDb().update(presets).set({ nome, descricao, campos }).where(eq(presets.id, id));
    return id;
  }
  const rows = await getDb().insert(presets).values({ nome, descricao, campos, escopo }).returning({ id: presets.id });
  return rows[0]?.id ?? null;
}
