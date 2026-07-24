"use client";

import { useRouter } from "next/navigation";
import type { LeadsMetrics, MetasDiarias, FilaData } from "@/app/lib/crm/leads-data";
import { MinhaMeta } from "./leads/MinhaMeta";
import { MetricasView } from "./leads/MetricasView";
import { MinhaFilaView } from "./leads/MinhaFilaView";

// Reaproveita os mesmos componentes de app/admin/crm/leads/ no dashboard,
// sem duplicar a lógica de cálculo de metas/métricas/fila (que vive em
// getLeadsData()). Clicar num item da fila leva pro módulo Leads de verdade.
export function DashboardLeadsWidgets({
  metas,
  metrics,
  fila,
}: {
  metas: MetasDiarias;
  metrics: LeadsMetrics;
  fila: FilaData;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <MinhaMeta metas={metas} metrics={metrics} />
      <MetricasView metrics={metrics} />
      <MinhaFilaView fila={fila} onOpen={() => router.push("/admin/crm/leads")} />
    </div>
  );
}
