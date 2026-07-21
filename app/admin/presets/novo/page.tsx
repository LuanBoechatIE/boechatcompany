import { PresetEditor } from "../PresetEditor";
import { createPreset } from "../../actions";

export const dynamic = "force-dynamic";

export default function NovoPreset() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl uppercase">Novo preset</h1>
      <PresetEditor action={createPreset} />
    </div>
  );
}
