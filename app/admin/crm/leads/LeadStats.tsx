"use client";

import { motion } from "framer-motion";
import {
  Phone,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  Flame,
  Clock,
  Percent,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatPct } from "@/app/lib/crm/format";
import type { LeadsMetrics } from "@/app/lib/crm/leads-data";

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
  inverse = false,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  sub?: string;
  inverse?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4 transition-colors hover:border-roxo-light/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gelo-dim">{label}</span>
        <span className="[&_svg]:h-3.5 [&_svg]:w-3.5" style={{ color: accent }}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-2xl leading-none text-gelo">{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-gelo-dim">{sub}</div>}
    </motion.div>
  );
}

export function LeadStats({ metrics }: { metrics: LeadsMetrics }) {
  const a = metrics.atividade.hoje;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="Ligações hoje" value={String(a.ligacoes)} icon={<Phone />} accent="#38bdf8" delay={0} />
      <StatCard label="Atendidas hoje" value={String(a.atendidas)} icon={<PhoneCall />} accent="#34d399" delay={0.03} />
      <StatCard label="Decisores hoje" value={String(a.decisores)} icon={<UserCheck />} accent="#a78bfa" delay={0.06} />
      <StatCard label="Reuniões hoje" value={String(a.reunioes)} icon={<CalendarCheck />} accent="#f472b6" delay={0.09} />
      <StatCard label="Follow-ups atrasados" value={String(metrics.followupsAtrasados)} icon={<AlertTriangle />} accent="#f87171" inverse delay={0.12} />
      <StatCard label="Leads ativos" value={String(metrics.leadsAtivos)} icon={<Flame />} accent="#fbbf24" delay={0.15} />
      <StatCard label="Sem interação +3d" value={String(metrics.semInteracao)} icon={<Clock />} accent="#fbbf24" inverse delay={0.18} />
      <StatCard label="Taxa de atendimento" value={formatPct(metrics.atividade.taxaAtendimento)} icon={<Percent />} accent="#34d399" delay={0.21} />
    </div>
  );
}
