import { dbConfigured } from "@/app/lib/db";
import { getSessaoAtual } from "@/app/lib/sessao";
import { getEquipeData } from "@/app/lib/crm/equipe-data";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { EquipeWorkspace } from "./EquipeWorkspace";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sessao = await getSessaoAtual();
  if (!sessao?.podeVerEquipe) return <SemPermissao area="a Performance da Equipe" />;

  let vendedores: Awaited<ReturnType<typeof getEquipeData>>["vendedores"];
  try {
    ({ vendedores } = await getEquipeData());
  } catch {
    return <CrmSetupNotice />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl uppercase">Performance da Equipe</h1>
        <p className="mt-1 text-sm text-gelo-dim">
          Ranking, comparação e visão individual de cada vendedor.
        </p>
      </div>

      <EquipeWorkspace vendedores={vendedores} />
    </div>
  );
}
