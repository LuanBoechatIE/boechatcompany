import { dbConfigured } from "@/app/lib/db";
import { listCargos } from "../../../../roles-actions";
import { listFormulariosRecrutamento, createVaga } from "../../../../recrutamento-actions";
import { SetupNotice } from "../../../../SetupNotice";
import { VagaForm } from "../VagaForm";

export const dynamic = "force-dynamic";

export default async function NovaVaga() {
  if (!dbConfigured()) return <SetupNotice />;

  const [cargos, formularios] = await Promise.all([
    listCargos(),
    listFormulariosRecrutamento(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl uppercase">Nova vaga</h1>
      <VagaForm
        action={createVaga}
        cargos={cargos.filter((c) => c.ativo)}
        formularios={formularios.map((f) => ({ id: f.id, nome: f.nome }))}
      />
    </div>
  );
}
