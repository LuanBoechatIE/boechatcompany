import {
  Wallet,
  Repeat,
  Hammer,
  Users,
  TrendingDown,
  PiggyBank,
  Receipt,
  CalendarRange,
} from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { getDashboardData } from "@/app/lib/crm/dashboard-data";
import { formatBRL, formatPct } from "@/app/lib/crm/format";
import { CrmSetupNotice } from "./CrmSetupNotice";
import { DashboardHeader } from "@/app/components/admin/dashboard/DashboardHeader";
import { KpiCard } from "@/app/components/admin/dashboard/KpiCard";
import { ChartCard } from "@/app/components/admin/dashboard/ChartCard";
import { RevenueChart } from "@/app/components/admin/dashboard/RevenueChart";
import { RecurringVsSetupChart } from "@/app/components/admin/dashboard/RecurringVsSetupChart";
import { ServiceDonutChart } from "@/app/components/admin/dashboard/ServiceDonutChart";
import { OperationCards } from "@/app/components/admin/dashboard/OperationCards";
import { AlertsPanel } from "@/app/components/admin/dashboard/AlertsPanel";
import { ActivityTimeline } from "@/app/components/admin/dashboard/ActivityTimeline";

export const dynamic = "force-dynamic";

export default async function CrmDashboard() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try {
    data = await getDashboardData();
  } catch {
    return <CrmSetupNotice />;
  }

  const { kpis, sparklines, charts, operacao, alertas, atividadeRecente } = data;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Receita total (mês)"
          value={formatBRL(kpis.receitaTotalMes, { compact: true })}
          icon={<Wallet />}
          sparkline={sparklines.receitaTotalMes}
          accent="#a78bfa"
          delay={0}
        />
        <KpiCard
          label="MRR"
          value={formatBRL(kpis.mrr, { compact: true })}
          sub="receita recorrente"
          icon={<Repeat />}
          sparkline={sparklines.mrr}
          accent="#6d28d9"
          delay={0.03}
        />
        <KpiCard
          label="Implementações (mês)"
          value={formatBRL(kpis.receitaImplementacoesMes, { compact: true })}
          icon={<Hammer />}
          sparkline={sparklines.receitaImplementacoesMes}
          accent="#a78bfa"
          delay={0.06}
        />
        <KpiCard
          label="Clientes ativos"
          value={String(kpis.clientesAtivos)}
          icon={<Users />}
          sparkline={sparklines.clientesAtivos}
          accent="#a78bfa"
          delay={0.09}
        />
        <KpiCard
          label="Churn"
          value={formatPct(kpis.churnPct)}
          icon={<TrendingDown />}
          accent="#f87171"
          delay={0.12}
        />
        <KpiCard
          label="Lucro (mês)"
          value={formatBRL(kpis.lucroMes, { compact: true })}
          icon={<PiggyBank />}
          sparkline={sparklines.lucroMes}
          accent="#34d399"
          delay={0.15}
        />
        <KpiCard
          label="Ticket médio"
          value={formatBRL(kpis.ticketMedio, { compact: true })}
          icon={<Receipt />}
          accent="#a78bfa"
          delay={0.18}
        />
        <KpiCard
          label="Previsto (30 dias)"
          value={formatBRL(kpis.receitaPrevista30d, { compact: true })}
          icon={<CalendarRange />}
          accent="#a78bfa"
          delay={0.21}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Evolução da receita" sub="12 meses" delay={0.1} className="h-56 lg:col-span-1">
          <RevenueChart data={charts.evolucaoReceita} />
        </ChartCard>
        <ChartCard title="Recorrente x implementação" sub="12 meses" delay={0.13} className="h-56 lg:col-span-1">
          <RecurringVsSetupChart data={charts.recorrenteVsImplementacao} />
        </ChartCard>
        <ChartCard title="Receita por serviço" sub="contratos ativos" delay={0.16} className="h-56 lg:col-span-1">
          <ServiceDonutChart data={charts.receitaPorServico} />
        </ChartCard>
      </div>

      {/* Operação + Alertas + Atividade */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <OperationCards {...operacao} />
          <ActivityTimeline eventos={atividadeRecente} />
        </div>
        <AlertsPanel {...alertas} />
      </div>
    </div>
  );
}
