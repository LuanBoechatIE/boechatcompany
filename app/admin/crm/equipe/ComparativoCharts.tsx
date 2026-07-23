"use client";

import { ChartCard } from "@/app/components/admin/dashboard/ChartCard";
import type { VendedorRanking } from "@/app/lib/crm/equipe-data";

const ACENTOS = ["#38bdf8", "#34d399", "#a78bfa", "#f472b6", "#fbbf24", "#818cf8", "#22d3ee"];

function BarList({ data, format, accent }: {
  data: { label: string; valor: number }[];
  format?: (v: number) => string;
  accent: (i: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <div className="flex flex-col gap-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[12px] text-gelo-dim">{d.label}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-ink">
            <div className="h-full rounded-md" style={{ width: `${(d.valor / max) * 100}%`, backgroundColor: accent(i), opacity: 0.85 }} />
          </div>
          <span className="w-16 shrink-0 text-right text-[12px] text-gelo">{format ? format(d.valor) : d.valor}</span>
        </div>
      ))}
    </div>
  );
}

export function ComparativoCharts({ vendedores }: { vendedores: VendedorRanking[] }) {
  const acc = (i: number) => ACENTOS[i % ACENTOS.length];
  const num1 = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  const ligacoes = vendedores.map((v) => ({ label: v.nome, valor: v.metrics.atividade.total.ligacoes }));
  const reunioes = vendedores.map((v) => ({ label: v.nome, valor: v.metrics.atividade.total.reunioes }));
  const conversao = vendedores.map((v) => ({
    label: v.nome,
    valor: v.metrics.leadsGanhos + v.metrics.leadsPerdidos > 0
      ? Math.round((v.metrics.leadsGanhos / (v.metrics.leadsGanhos + v.metrics.leadsPerdidos)) * 100)
      : 0,
  }));
  const tempoReuniao = vendedores.map((v) => ({ label: v.nome, valor: Math.round(v.metrics.atividade.mediaDiasReuniao * 10) / 10 }));
  const leadsAtivos = vendedores.map((v) => ({ label: v.nome, valor: v.metrics.leadsAtivos }));
  const followups = vendedores.map((v) => ({ label: v.nome, valor: v.metrics.atividade.total.followupsCriados }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Ligações por vendedor" delay={0.05}>
        <BarList data={ligacoes} accent={acc} />
      </ChartCard>
      <ChartCard title="Reuniões por vendedor" delay={0.08}>
        <BarList data={reunioes} accent={acc} />
      </ChartCard>
      <ChartCard title="Conversão por vendedor" sub="% ganhos / fechados" delay={0.11}>
        <BarList data={conversao} format={(v) => `${v}%`} accent={acc} />
      </ChartCard>
      <ChartCard title="Tempo médio até reunião" sub="dias" delay={0.14}>
        <BarList data={tempoReuniao} format={num1} accent={acc} />
      </ChartCard>
      <ChartCard title="Leads ativos por vendedor" delay={0.17}>
        <BarList data={leadsAtivos} accent={acc} />
      </ChartCard>
      <ChartCard title="Follow-ups por vendedor" delay={0.2}>
        <BarList data={followups} accent={acc} />
      </ChartCard>
    </div>
  );
}
