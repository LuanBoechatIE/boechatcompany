import { temPermissao } from "@/app/lib/perms-guard";
import { SemPermissao } from "../../crm/SemPermissao";
import { PresetEditor } from "../PresetEditor";
import { createPreset } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NovoPreset() {
  if (!(await temPermissao("presets.criar"))) return <SemPermissao area="Novo preset" />;

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl uppercase">Novo preset</h1>
      <PresetEditor action={createPreset} />
    </div>
  );
}
