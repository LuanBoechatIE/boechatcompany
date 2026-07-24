"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Inbox, UserRoundPlus, KanbanSquare } from "lucide-react";
import { formatDateFull } from "@/app/lib/crm/format";

function saudacao() {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHeader({
  nome,
  podeNovoLead = true,
  podeNovoCliente = true,
  podeNovoProjeto = true,
}: {
  nome: string;
  podeNovoLead?: boolean;
  podeNovoCliente?: boolean;
  podeNovoProjeto?: boolean;
}) {
  const hoje = formatDateFull(new Date());

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h1 className="font-display text-2xl uppercase text-gelo sm:text-3xl">
          {saudacao()}
          {nome ? `, ${nome}` : ""}
          <span className="text-roxo">.</span>
        </h1>
        <p className="mt-1 text-sm capitalize text-gelo-dim">{hoje}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {podeNovoLead && (
          <Link
            href="/admin/crm/leads"
            className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-soft/40 px-4 py-2 text-xs font-medium text-gelo transition-colors hover:border-roxo-light/40"
          >
            <Inbox className="h-3.5 w-3.5" />
            Novo lead
          </Link>
        )}
        {podeNovoCliente && (
          <Link
            href="/admin/crm/clientes/novo"
            className="flex items-center gap-2 rounded-full border border-ink-line bg-ink-soft/40 px-4 py-2 text-xs font-medium text-gelo transition-colors hover:border-roxo-light/40"
          >
            <UserRoundPlus className="h-3.5 w-3.5" />
            Novo cliente
          </Link>
        )}
        {podeNovoProjeto && (
          <Link
            href="/admin/crm/projetos/novo"
            className="flex items-center gap-2 rounded-full bg-roxo px-4 py-2 text-xs font-medium text-white shadow-[0_8px_30px_-10px_rgba(109,40,217,0.7)] hover:opacity-90"
          >
            <KanbanSquare className="h-3.5 w-3.5" />
            Novo projeto
          </Link>
        )}
      </div>
    </motion.div>
  );
}
