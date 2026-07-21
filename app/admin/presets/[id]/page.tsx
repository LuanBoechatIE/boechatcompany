import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import type { FieldDef } from "@/app/lib/onboarding/types";
import { PresetEditor } from "../PresetEditor";
import { updatePreset } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarPreset({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presetId = Number(id);
  if (!presetId) notFound();

  const rows = await getDb()
    .select()
    .from(presets)
    .where(eq(presets.id, presetId))
    .limit(1);
  const preset = rows[0];
  if (!preset) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl uppercase">Editar preset</h1>
      <PresetEditor
        action={updatePreset}
        initial={{
          id: preset.id,
          nome: preset.nome,
          descricao: preset.descricao,
          campos: (preset.campos as FieldDef[]) ?? [],
        }}
      />
    </div>
  );
}
