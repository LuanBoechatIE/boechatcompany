import { dbConfigured } from "@/app/lib/db";
import { getLeadsData } from "@/app/lib/crm/leads-data";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { LeadsWorkspace } from "./LeadsWorkspace";
import { LeadsToolbar } from "./LeadsToolbar";
import { LeadsFilterBar } from "./LeadsFilterBar";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sp = await searchParams;

  let data: Awaited<ReturnType<typeof getLeadsData>>;
  try {
    data = await getLeadsData(sp);
  } catch {
    return <CrmSetupNotice />;
  }

  const { leads: dtos, atividadesPorLead, metrics, fila, filtrosSalvos, filtros } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Central comercial</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Prospecção, follow-up e pipeline num só lugar.
          </p>
        </div>
        <LeadsToolbar leads={dtos} />
      </div>

      <LeadsFilterBar filtros={filtros as Record<string, string>} filtrosSalvos={filtrosSalvos} />

      <LeadsWorkspace
        leads={dtos}
        atividadesPorLead={atividadesPorLead}
        metrics={metrics}
        fila={fila}
      />
    </div>
  );
}
