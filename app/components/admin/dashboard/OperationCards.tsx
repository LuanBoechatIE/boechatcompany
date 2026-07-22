"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { KanbanSquare, ListTodo, ClipboardList, Inbox } from "lucide-react";

export function OperationCards({
  projetosAtivos,
  demandasAbertas,
  onboardingsPendentes,
  leadsAtivos,
}: {
  projetosAtivos: number;
  demandasAbertas: number;
  onboardingsPendentes: number;
  leadsAtivos: number;
}) {
  const items = [
    { label: "Projetos ativos", valor: projetosAtivos, icon: KanbanSquare, href: "/admin/crm/projetos" },
    { label: "Demandas abertas", valor: demandasAbertas, icon: ListTodo, href: "/admin/crm/demandas" },
    { label: "Onboardings pendentes", valor: onboardingsPendentes, icon: ClipboardList, href: "/admin" },
    { label: "Leads ativos", valor: leadsAtivos, icon: Inbox, href: "/admin/crm/leads" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={it.href}
            className="group flex items-center gap-3 rounded-2xl border border-ink-line bg-ink-soft/40 p-4 transition-colors hover:border-roxo-light/30"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-roxo-light transition-transform group-hover:scale-105">
              <it.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="font-display text-xl leading-none text-gelo">{it.valor}</div>
              <div className="mt-1 truncate text-[11px] uppercase tracking-wide text-gelo-dim">
                {it.label}
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
