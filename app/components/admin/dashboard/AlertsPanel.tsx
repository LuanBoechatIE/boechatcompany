"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  UserX,
  CalendarClock,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import { formatBRL, formatDate } from "@/app/lib/crm/format";

type Item = { id: number; titulo: string; valor?: number; vencimento?: Date };

export function AlertsPanel({
  pagamentosAtrasados,
  projetosEmAtraso,
  clientesEmRisco,
  contratosProximoVencimento,
  onboardingsPendentes,
}: {
  pagamentosAtrasados: Item[];
  projetosEmAtraso: Item[];
  clientesEmRisco: Item[];
  contratosProximoVencimento: Item[];
  onboardingsPendentes: Item[];
}) {
  const groups = [
    {
      key: "pagamentos",
      label: "Pagamentos atrasados",
      icon: AlertTriangle,
      color: "text-red-300",
      dot: "bg-red-400",
      items: pagamentosAtrasados,
      render: (i: Item) => `${i.titulo}${i.valor ? ` · ${formatBRL(i.valor)}` : ""}`,
      href: "/admin/crm/clientes",
    },
    {
      key: "projetos",
      label: "Projetos em atraso",
      icon: Clock,
      color: "text-yellow-200",
      dot: "bg-yellow-400",
      items: projetosEmAtraso,
      render: (i: Item) => i.titulo,
      href: "/admin/crm/projetos",
    },
    {
      key: "clientes",
      label: "Clientes em risco",
      icon: UserX,
      color: "text-orange-200",
      dot: "bg-orange-400",
      items: clientesEmRisco,
      render: (i: Item) => i.titulo,
      href: "/admin/crm/clientes",
    },
    {
      key: "contratos",
      label: "Vencendo essa semana",
      icon: CalendarClock,
      color: "text-sky-200",
      dot: "bg-sky-400",
      items: contratosProximoVencimento,
      render: (i: Item) => `${i.titulo}${i.vencimento ? ` · ${formatDate(i.vencimento)}` : ""}`,
      href: "/admin/crm/clientes",
    },
    {
      key: "onboardings",
      label: "Onboardings pendentes",
      icon: ClipboardList,
      color: "text-roxo-light",
      dot: "bg-roxo-light",
      items: onboardingsPendentes,
      render: (i: Item) => i.titulo,
      href: "/admin",
    },
  ];

  const total = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4"
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gelo">
        Precisa de atenção
      </h3>

      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          <span className="text-xs text-gelo-dim">Tudo em dia. Nenhum alerta agora.</span>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
          {groups
            .filter((g) => g.items.length > 0)
            .map((g) => (
              <Link
                key={g.key}
                href={g.href}
                className="group rounded-xl border border-ink-line bg-ink/50 p-3 transition-colors hover:border-roxo-light/30"
              >
                <div className="flex items-center gap-2">
                  <g.icon className={`h-3.5 w-3.5 shrink-0 ${g.color}`} />
                  <span className="text-xs font-medium text-gelo">{g.label}</span>
                  <span className="ml-auto rounded-full bg-ink-line px-2 py-0.5 text-[10px] text-gelo-dim">
                    {g.items.length}
                  </span>
                </div>
                <ul className="mt-2 flex flex-col gap-1">
                  {g.items.slice(0, 3).map((i) => (
                    <li key={i.id} className="truncate text-[11px] text-gelo-dim">
                      {g.render(i)}
                    </li>
                  ))}
                  {g.items.length > 3 && (
                    <li className="text-[11px] text-gelo-dim/60">
                      +{g.items.length - 3} outro{g.items.length - 3 === 1 ? "" : "s"}
                    </li>
                  )}
                </ul>
              </Link>
            ))}
        </div>
      )}
    </motion.div>
  );
}
