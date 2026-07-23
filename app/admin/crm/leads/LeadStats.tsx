"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  CalendarClock,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { formatBRL, formatPct } from "@/app/lib/crm/format";
import type { LeadsMetrics } from "@/app/lib/crm/leads-data";

type Delta = { valor: number; label: string } | null;

function StatCard({
  label,
  value,
  icon,
  accent,
  delta,
  inverse = false,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
  delta?: Delta;
  inverse?: boolean;
  delay?: number;
}) {
  // Para métricas "ruins quando sobem" (atrasados, sem contato), inverte a cor.
  const positivo = delta ? (inverse ? delta.valor < 0 : delta.valor > 0) : false;
  const negativo = delta ? (inverse ? delta.valor > 0 : delta.valor < 0) : false;
  const deltaCor = positivo ? "text-emerald-400" : negativo ? "text-red-400" : "text-gelo-dim";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4 transition-colors hover:border-roxo-light/30"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gelo-dim">
          {label}
        </span>
        <span
          className="h-3.5 w-3.5 shrink-0 transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5"
          style={{ color: accent }}
        >
          {icon}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="font-display text-2xl leading-none text-gelo">{value}</div>
        {delta && delta.valor !== 0 && (
          <span className={`flex items-center gap-0.5 text-[11px] ${deltaCor}`}>
            {delta.valor > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function LeadStats({ metrics }: { metrics: LeadsMetrics }) {
  const sem7 = metrics.bucketsSemInteracao.find((b) => b.dias === 7)?.total ?? 0;
  const deltaCriados = metrics.criadosHoje - metrics.criadosOntem;
  const deltaConversao = metrics.conversaoMes - metrics.conversaoMesPassado;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Leads ativos"
        value={String(metrics.leadsAtivos)}
        icon={<Users />}
        accent="#a78bfa"
        delay={0}
      />
      <StatCard
        label="Criados hoje"
        value={String(metrics.criadosHoje)}
        icon={<UserPlus />}
        accent="#a78bfa"
        delta={{ valor: deltaCriados, label: `${Math.abs(deltaCriados)} vs ontem` }}
        delay={0.03}
      />
      <StatCard
        label="Follow-ups hoje"
        value={String(metrics.followupsHoje)}
        icon={<CalendarClock />}
        accent="#38bdf8"
        delay={0.06}
      />
      <StatCard
        label="Follow-ups atrasados"
        value={String(metrics.followupsAtrasados)}
        icon={<AlertTriangle />}
        accent="#f87171"
        inverse
        delay={0.09}
      />
      <StatCard
        label="Sem contato +7d"
        value={String(sem7)}
        icon={<Clock />}
        accent="#fbbf24"
        inverse
        delay={0.12}
      />
      <StatCard
        label="Conversão do mês"
        value={formatPct(metrics.conversaoMes)}
        icon={<TrendingUp />}
        accent="#34d399"
        delta={{ valor: deltaConversao, label: `${Math.abs(deltaConversao).toFixed(0)} pp` }}
        delay={0.15}
      />
      <StatCard
        label="Receita prevista"
        value={formatBRL(metrics.receitaPrevista, { compact: true })}
        icon={<Wallet />}
        accent="#34d399"
        delay={0.18}
      />
      <StatCard
        label="Ticket médio"
        value={formatBRL(metrics.ticketMedio, { compact: true })}
        icon={<Receipt />}
        accent="#a78bfa"
        delay={0.21}
      />
    </div>
  );
}
