import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { getVagaPorId } from "@/app/lib/recrutamento/data";
import { listCargos } from "../../../../roles-actions";
import { listFormulariosRecrutamento, updateVaga } from "../../../../recrutamento-actions";
import { SetupNotice } from "../../../../SetupNotice";
import { CopyLink } from "../../../../CopyLink";
import { VagaForm } from "../VagaForm";

export const dynamic = "force-dynamic";

export default async function EditarVaga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!dbConfigured()) return <SetupNotice />;

  const { id } = await params;
  const vagaId = Number(id);
  if (!vagaId) notFound();

  const [vaga, cargos, formularios] = await Promise.all([
    getVagaPorId(vagaId),
    listCargos(),
    listFormulariosRecrutamento(),
  ]);
  if (!vaga) notFound();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl uppercase">Editar vaga</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim">
            <Users className="h-3.5 w-3.5" />
            {vaga.totalCandidaturas} {vaga.totalCandidaturas === 1 ? "candidatura" : "candidaturas"}
          </span>
          <CopyLink token={vaga.token} basePath="/vagas" compact />
        </div>
      </div>

      <VagaForm
        action={updateVaga}
        cargos={cargos.filter((c) => c.ativo)}
        formularios={formularios.map((f) => ({ id: f.id, nome: f.nome }))}
        initial={{
          id: vaga.id,
          nome: vaga.nome,
          descricao: vaga.descricao,
          cargoId: vaga.cargoId,
          departamento: vaga.departamento,
          modelo: vaga.modelo,
          cidade: vaga.cidade,
          status: vaga.status,
          presetId: vaga.presetId,
        }}
      />
    </div>
  );
}
