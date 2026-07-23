"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Phone,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  MessageCircle,
  MessageSquareDot,
  Trophy,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { ChartCard } from "@/app/components/admin/dashboard/ChartCard";
import { formatPct } from "@/app/lib/crm/format";
import type { LeadsMetrics } from "@/app/lib/crm/leads-data";

const ACENTOS = ["#38bdf8", "#34d399", "#a78bfa", "#f472b6", "#fbbf24", "#818cf8", "#22d3ee", "#f87171"];

const ATIV_LABEL: Record<string, string> = {
  ligacao: "Ligações", whatsapp: "WhatsApp", email: "E-mails", reuniao: "Reuniões",
  proposta: "Propostas", visita: "Visitas", mensagem: "Mensagens",
};

function StatTile({ label, value, icon, accent, sub }: {
  label: string; value: string; icon: ReactNode; accent: string; sub?: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-ink-line bg-ink-soft/40 p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gelo-dim">{label}</span>
        <span className="[&_svg]:h-4 [&_svg]:w-4" style={{ color: accent }}>{icon}</span>
      </div>
      <div className="mt-3 font-display text-2xl leading-none text-gelo">{value}</div>
      {sub && <div className="mt-1 text-[11px] text-gelo-dim">{sub}</div>}
    </div>
  );
}

function BarList({ data, format, accent = "#a78bfa" }: {
  data: { label: string; valor: number; extra?: string }[];
  format?: (v: number) => string;
  accent?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.valor));
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-[12px] text-gelo-dim">{d.label}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-ink">
            <div className="h-full rounded-md" style={{ width: `${(d.valor / max) * 100}%`, backgroundColor: accent, opacity: 0.85 }} />
          </div>
          <span className="w-20 shrink-0 text-right text-[12px] text-gelo">
            {format ? format(d.valor) : d.valor}
            {d.extra && <span className="ml-1 text-gelo-dim/60">{d.extra}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function Taxa({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] text-gelo-dim">{label}</span>
        <span className="font-display text-lg text-gelo">{formatPct(pct)}</span>
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-ink-line">
        <span className="block h-full rounded-full bg-roxo-light" style={{ width: `${Math.min(100, pct)}%` }} />
      </span>
    </div>
  );
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs">
      <p className="text-gelo">{label}</p>
      <p className="text-gelo-dim">{payload[0].value}</p>
    </div>
  );
}

export function MetricasView({ metrics }: { metrics: LeadsMetrics }) {
  const t = metrics.atividade.total;
  const a = metrics.atividade;
  const dias = (n: number) => `${Math.round(n)} ${Math.round(n) === 1 ? "dia" : "dias"}`;
  const num1 = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  const funil = metrics.funil.map((f) => ({ label: f.label, valor: f.total }));
  const atividades = Object.entries(metrics.atividadesPorTipo)
    .map(([k, v]) => ({ label: ATIV_LABEL[k] ?? k, valor: v }))
    .filter((d) => d.valor > 0)
    .sort((x, y) => y.valor - x.valor);
  const origem = metrics.conversaoPorOrigem
    .filter((o) => o.total > 0).sort((x, y) => y.total - x.total)
    .map((o) => ({ label: o.chave, valor: Math.round(o.conversao), extra: `${o.total}` }));
  const responsavel = metrics.conversaoPorResponsavel
    .filter((r) => r.chave !== "—" && r.total > 0)
    .map((r) => ({ label: r.chave, valor: Math.round(r.conversao), extra: `${r.total}` }));
  const buckets = metrics.bucketsSemInteracao.map((b) => ({ label: `${b.dias}+ dias`, valor: b.total }));

  return (
    <div className="flex flex-col gap-4">
      {/* Volume de atividade (total) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ligações" value={String(t.ligacoes)} icon={<Phone />} accent="#38bdf8" sub={`${a.hoje.ligacoes} hoje`} />
        <StatTile label="Atendidas" value={String(t.atendidas)} icon={<PhoneCall />} accent="#34d399" sub={`${a.hoje.atendidas} hoje`} />
        <StatTile label="Com decisor" value={String(t.decisores)} icon={<UserCheck />} accent="#a78bfa" sub={`${a.hoje.decisores} hoje`} />
        <StatTile label="Reuniões agendadas" value={String(t.reunioes)} icon={<CalendarCheck />} accent="#f472b6" sub={`${a.hoje.reunioes} hoje`} />
        <StatTile label="WhatsApps enviados" value={String(t.whatsapps)} icon={<MessageCircle />} accent="#22d3ee" sub={`${a.hoje.whatsapps} hoje`} />
        <StatTile label="WhatsApps respondidos" value={String(t.whatsappsRespondidos)} icon={<MessageSquareDot />} accent="#22d3ee" />
        <StatTile label="Leads ganhos" value={String(metrics.leadsGanhos)} icon={<Trophy />} accent="#34d399" sub={`${metrics.ganhosMes} no mês`} />
        <StatTile label="Leads perdidos" value={String(metrics.leadsPerdidos)} icon={<XCircle />} accent="#f87171" sub={`${metrics.perdidosMes} no mês`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Taxas de conversão da cadência" sub="funil de atividade" delay={0.05}>
          <div className="flex flex-col gap-4 pt-1">
            <Taxa label="Atendimento (atendidas / ligações)" pct={a.taxaAtendimento} />
            <Taxa label="Contato com decisor (decisor / atendidas)" pct={a.taxaDecisor} />
            <Taxa label="Agendamento (reuniões / decisor)" pct={a.taxaReuniao} />
          </div>
        </ChartCard>

        <ChartCard title="Médias de esforço" sub="quanto custa cada resultado" delay={0.08}>
          <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
            <StatTile label="Tentativas / atendimento" value={num1(a.mediaTentativasAtendimento)} icon={<PhoneCall />} accent="#34d399" />
            <StatTile label="Tentativas / reunião" value={num1(a.mediaTentativasReuniao)} icon={<CalendarCheck />} accent="#f472b6" />
            <StatTile label="Dias até a reunião" value={dias(a.mediaDiasReuniao)} icon={<UserCheck />} accent="#a78bfa" />
          </div>
        </ChartCard>

        <ChartCard title="Funil do pipeline" sub="leads por etapa" delay={0.11}>
          <BarList data={funil} accent="#a78bfa" />
        </ChartCard>

        <ChartCard title="Atividades por tipo" sub="total registrado" delay={0.14} className="min-h-[16rem]">
          {atividades.length === 0 ? (
            <p className="py-10 text-center text-sm text-gelo-dim/50">Nenhuma atividade registrada ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atividades} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: "#8b8b9e", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8b8b9e", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(167,139,250,0.08)" }} content={<TooltipBox />} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {atividades.map((_, i) => <Cell key={i} fill={ACENTOS[i % ACENTOS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Conversão por origem" sub="% ganhos / fechados" delay={0.17}>
          {origem.length === 0 ? <p className="py-10 text-center text-sm text-gelo-dim/50">Sem dados.</p> : <BarList data={origem} format={(v) => `${v}%`} accent="#38bdf8" />}
        </ChartCard>

        <ChartCard title="Conversão por responsável" sub="% ganhos / fechados" delay={0.2}>
          {responsavel.length === 0 ? <p className="py-10 text-center text-sm text-gelo-dim/50">Sem dados.</p> : <BarList data={responsavel} format={(v) => `${v}%`} accent="#34d399" />}
        </ChartCard>

        <ChartCard title="Sem interação (operacional)" sub="leads ativos parados" delay={0.23} className="lg:col-span-2">
          <BarList data={buckets} accent="#fbbf24" />
        </ChartCard>
      </div>
    </div>
  );
}
