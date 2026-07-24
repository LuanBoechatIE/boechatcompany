import { dbConfigured } from "@/app/lib/db";
import { getSessaoAtual } from "@/app/lib/sessao";
import { getEquipeData, type EquipePeriodo } from "@/app/lib/crm/equipe-data";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { EquipeWorkspace } from "./EquipeWorkspace";
import { PeriodoFiltro } from "./PeriodoFiltro";

export const dynamic = "force-dynamic";

const PERIODOS_VALIDOS: EquipePeriodo[] = ["hoje", "7dias", "30dias", "mes", "tudo"];

export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sessao = await getSessaoAtual();
  if (!sessao?.podeVerEquipe) return <SemPermissao area="a Performance da Equipe" />;

  const { periodo: periodoParam } = await searchParams;
  const periodo: EquipePeriodo = PERIODOS_VALIDOS.includes(periodoParam as EquipePeriodo)
    ? (periodoParam as EquipePeriodo)
    : "tudo";

  let vendedores: Awaited<ReturnType<typeof getEquipeData>>["vendedores"];
  try {
    ({ vendedores } = await getEquipeData(periodo));
  } catch {
    return <CrmSetupNotice />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Performance da Equipe</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Ranking, comparação e visão individual de cada vendedor.
          </p>
        </div>
        <PeriodoFiltro atual={periodo} />
      </div>

      <EquipeWorkspace vendedores={vendedores} />
    </div>
  );
}
