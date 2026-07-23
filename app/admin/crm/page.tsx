import { cookies } from "next/headers";
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
import { resolvePeriodo } from "@/app/lib/crm/period";
import { SESSION_COOKIE, verifySession } from "@/app/lib/auth";
import { CrmSetupNotice } from "./CrmSetupNotice";
import { DashboardHeader } from "@/app/components/admin/dashboard/DashboardHeader";
import { PeriodFilter } from "@/app/components/admin/dashboard/PeriodFilter";
import { KpiCard } from "@/app/components/admin/dashboard/KpiCard";
import { ChartCard } from "@/app/components/admin/dashboard/ChartCard";
import { RevenueChart } from "@/app/components/admin/dashboard/RevenueChart";
import { RecurringVsSetupChart } from "@/app/components/admin/dashboard/RecurringVsSetupChart";
import { ServiceDonutChart } from "@/app/components/admin/dashboard/ServiceDonutChart";
import { OperationCards } from "@/app/components/admin/dashboard/OperationCards";
import { AlertsPanel } from "@/app/components/admin/dashboard/AlertsPanel";
import { ActivityTimeline } from "@/app/components/admin/dashboard/ActivityTimeline";

export const dynamic = "force-dynamic";

export default async function CrmDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sp = await searchParams;
  const periodo = resolvePeriodo(sp);

  const cookieStore = await cookies();
  const username = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

  // Valores financeiros só aparecem para quem tem financeiro.visualizar.
  const { temPermissao } = await import("@/app/lib/perms-guard");
  const podeFinanceiro = await temPermissao("financeiro.visualizar");

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try {
    data = await getDashboardData({ start: periodo.start, end: periodo.end });
  } catch {
    return <CrmSetupNotice />;
  }

  const { kpis, sparklines, charts, operacao, alertas, atividadeRecente } = data;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader username={username ?? ""} />

      <PeriodFilter atual={periodo.key} de={periodo.de} ate={periodo.ate} />

      {/* KPIs principais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {podeFinanceiro && (
        <KpiCard
          label="Receita total"
          value={formatBRL(kpis.receitaTotalMes, { compact: true })}
          sub={periodo.label}
          icon={<Wallet />}
          sparkline={sparklines.receitaTotalMes}
          accent="#a78bfa"
          delay={0}
        />
        )}
        {podeFinanceiro && (
        <KpiCard
          label="MRR"
          value={formatBRL(kpis.mrr, { compact: true })}
          sub="receita recorrente"
          icon={<Repeat />}
          sparkline={sparklines.mrr}
          accent="#6d28d9"
          delay={0.03}
        />
        )}
        {podeFinanceiro && (
        <KpiCard
          label="Implementações"
          value={formatBRL(kpis.receitaImplementacoesMes, { compact: true })}
          sub={periodo.label}
          icon={<Hammer />}
          sparkline={sparklines.receitaImplementacoesMes}
          accent="#a78bfa"
          delay={0.06}
        />
        )}
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
          sub={periodo.label}
          icon={<TrendingDown />}
          accent="#f87171"
          delay={0.12}
        />
        {podeFinanceiro && (
        <KpiCard
          label="Lucro"
          value={formatBRL(kpis.lucroMes, { compact: true })}
          sub={periodo.label}
          icon={<PiggyBank />}
          sparkline={sparklines.lucroMes}
          accent="#34d399"
          delay={0.15}
        />
        )}
        {podeFinanceiro && (
        <KpiCard
          label="Ticket médio"
          value={formatBRL(kpis.ticketMedio, { compact: true })}
          icon={<Receipt />}
          accent="#a78bfa"
          delay={0.18}
        />
        )}
        {podeFinanceiro && (
        <KpiCard
          label="Previsto (30 dias)"
          value={formatBRL(kpis.receitaPrevista30d, { compact: true })}
          icon={<CalendarRange />}
          accent="#a78bfa"
          delay={0.21}
        />
        )}
      </div>

      {/* Gráficos (receita) — só com permissão financeira */}
      {podeFinanceiro && (
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
      )}

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
