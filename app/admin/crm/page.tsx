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
import { getLeadsData } from "@/app/lib/crm/leads-data";
import { getSessaoAtual } from "@/app/lib/sessao";
import { temPermissao } from "@/app/lib/perms-guard";
import { formatBRL, formatPct } from "@/app/lib/crm/format";
import { resolvePeriodo } from "@/app/lib/crm/period";
import { getPerfilAtual } from "@/app/admin/perfil-actions";
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
import { MeuPontoCard } from "./MeuPontoCard";
import { DashboardLeadsWidgets } from "./DashboardLeadsWidgets";

export const dynamic = "force-dynamic";

export default async function CrmDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sp = await searchParams;
  const periodo = resolvePeriodo(sp);

  const perfil = await getPerfilAtual();
  const primeiroNome = perfil?.nome?.split(" ")[0] ?? "";

  // Cada bloco do dashboard é modular: só renderiza se o cargo tiver a
  // permissão correspondente. Nada de `if (cargo === "SDR")` espalhado.
  const [podeFinanceiro, podeKpisExecutivos, podeLeads, podeNovoLead, podeNovoCliente, podeNovoProjeto] = await Promise.all([
    temPermissao("financeiro.visualizar"),
    temPermissao("dashboard.kpis_executivos"),
    temPermissao("leads.visualizar"),
    temPermissao("leads.criar"),
    temPermissao("clientes.criar"),
    temPermissao("projetos.criar"),
  ]);

  let leadsWidgets: { metas: Awaited<ReturnType<typeof getLeadsData>>["metas"]; metrics: Awaited<ReturnType<typeof getLeadsData>>["metrics"]; fila: Awaited<ReturnType<typeof getLeadsData>>["fila"] } | null = null;
  if (podeLeads) {
    const sessao = await getSessaoAtual();
    if (sessao) {
      try {
        const ld = await getLeadsData({}, sessao.username, sessao.podeVerEquipe ? null : sessao.id);
        leadsWidgets = { metas: ld.metas, metrics: ld.metrics, fila: ld.fila };
      } catch {
        leadsWidgets = null;
      }
    }
  }

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  if (podeKpisExecutivos) {
    try {
      data = await getDashboardData({ start: periodo.start, end: periodo.end });
    } catch {
      return <CrmSetupNotice />;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        nome={primeiroNome}
        podeNovoLead={podeNovoLead}
        podeNovoCliente={podeNovoCliente}
        podeNovoProjeto={podeNovoProjeto}
      />

      <MeuPontoCard />

      {leadsWidgets && (
        <DashboardLeadsWidgets metas={leadsWidgets.metas} metrics={leadsWidgets.metrics} fila={leadsWidgets.fila} />
      )}

      {podeKpisExecutivos && data && (
        <>
          <PeriodFilter atual={periodo.key} de={periodo.de} ate={periodo.ate} />

          {/* KPIs principais */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {podeFinanceiro && (
            <KpiCard
              label="Receita total"
              value={formatBRL(data.kpis.receitaTotalMes, { compact: true })}
              sub={periodo.label}
              icon={<Wallet />}
              sparkline={data.sparklines.receitaTotalMes}
              accent="#a78bfa"
              delay={0}
            />
            )}
            {podeFinanceiro && (
            <KpiCard
              label="MRR"
              value={formatBRL(data.kpis.mrr, { compact: true })}
              sub="receita recorrente"
              icon={<Repeat />}
              sparkline={data.sparklines.mrr}
              accent="#6d28d9"
              delay={0.03}
            />
            )}
            {podeFinanceiro && (
            <KpiCard
              label="Implementações"
              value={formatBRL(data.kpis.receitaImplementacoesMes, { compact: true })}
              sub={periodo.label}
              icon={<Hammer />}
              sparkline={data.sparklines.receitaImplementacoesMes}
              accent="#a78bfa"
              delay={0.06}
            />
            )}
            <KpiCard
              label="Clientes ativos"
              value={String(data.kpis.clientesAtivos)}
              icon={<Users />}
              sparkline={data.sparklines.clientesAtivos}
              accent="#a78bfa"
              delay={0.09}
            />
            <KpiCard
              label="Churn"
              value={formatPct(data.kpis.churnPct)}
              sub={periodo.label}
              icon={<TrendingDown />}
              accent="#f87171"
              delay={0.12}
            />
            {podeFinanceiro && (
            <KpiCard
              label="Lucro"
              value={formatBRL(data.kpis.lucroMes, { compact: true })}
              sub={periodo.label}
              icon={<PiggyBank />}
              sparkline={data.sparklines.lucroMes}
              accent="#34d399"
              delay={0.15}
            />
            )}
            {podeFinanceiro && (
            <KpiCard
              label="Ticket médio"
              value={formatBRL(data.kpis.ticketMedio, { compact: true })}
              icon={<Receipt />}
              accent="#a78bfa"
              delay={0.18}
            />
            )}
            {podeFinanceiro && (
            <KpiCard
              label="Previsto (30 dias)"
              value={formatBRL(data.kpis.receitaPrevista30d, { compact: true })}
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
              <RevenueChart data={data.charts.evolucaoReceita} />
            </ChartCard>
            <ChartCard title="Recorrente x implementação" sub="12 meses" delay={0.13} className="h-56 lg:col-span-1">
              <RecurringVsSetupChart data={data.charts.recorrenteVsImplementacao} />
            </ChartCard>
            <ChartCard title="Receita por serviço" sub="contratos ativos" delay={0.16} className="h-56 lg:col-span-1">
              <ServiceDonutChart data={data.charts.receitaPorServico} />
            </ChartCard>
          </div>
          )}

          {/* Operação + Alertas + Atividade */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <OperationCards {...data.operacao} />
              <ActivityTimeline eventos={data.atividadeRecente} />
            </div>
            <AlertsPanel {...data.alertas} />
          </div>
        </>
      )}
    </div>
  );
}
