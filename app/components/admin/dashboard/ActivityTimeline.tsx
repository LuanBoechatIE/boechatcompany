"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  FileSignature,
  Wallet,
  KanbanSquare,
  CheckSquare,
  Activity,
} from "lucide-react";
import { formatDate } from "@/app/lib/crm/format";

const ICONS: Record<string, typeof UserPlus> = {
  cliente: UserPlus,
  contrato: FileSignature,
  pagamento: Wallet,
  projeto: KanbanSquare,
  demanda: CheckSquare,
};

export function ActivityTimeline({
  eventos,
}: {
  eventos: { tipo: string; titulo: string; quando: Date }[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-4"
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gelo">
        Atividade recente
      </h3>

      {eventos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <Activity className="h-6 w-6 text-gelo-dim" />
          <span className="text-xs text-gelo-dim">Nada por aqui ainda.</span>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-2.5 overflow-y-auto">
          {eventos.map((e, idx) => {
            const Icon = ICONS[e.tipo] ?? Activity;
            return (
              <li key={`${e.tipo}-${idx}`} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-roxo-light">
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs text-gelo">{e.titulo}</div>
                  <div className="text-[10px] text-gelo-dim">{formatDate(e.quando)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
