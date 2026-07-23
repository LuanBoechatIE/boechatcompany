"use client";

import { motion } from "framer-motion";
import {
  X,
  Phone,
  PhoneCall,
  CalendarCheck,
  MessageCircle,
  StickyNote,
  History,
  FileText,
  MapPin,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { LEAD_STAGES, brl } from "@/app/lib/crm/types";
import { formatPct } from "@/app/lib/crm/format";
import type { VendedorRanking } from "@/app/lib/crm/equipe-data";

const ATIV_ICON: Record<string, LucideIcon> = {
  ligacao: Phone,
  whatsapp: MessageCircle,
  reuniao: CalendarCheck,
  visita: MapPin,
  proposta: FileText,
  nota: StickyNote,
  auditoria: History,
  outro: MessageSquare,
};

function Stat({ label, hoje, total }: { label: string; hoje: number; total: number }) {
  return (
    <div className="rounded-xl border border-ink-line bg-ink p-3">
      <p className="text-[10px] uppercase tracking-wide text-gelo-dim">{label}</p>
      <p className="mt-1 font-display text-xl text-gelo">{total}</p>
      <p className="text-[11px] text-gelo-dim">{hoje} hoje</p>
    </div>
  );
}

export function VendedorPainel({ vendedor, onClose }: { vendedor: VendedorRanking; onClose: () => void }) {
  const m = vendedor.metrics;
  const taxaConversao = m.leadsGanhos + m.leadsPerdidos > 0 ? (m.leadsGanhos / (m.leadsGanhos + m.leadsPerdidos)) * 100 : 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <motion.div
        initial={{ x: 40, opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-ink-line bg-ink-soft shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-line p-5">
          <div className="flex items-center gap-3">
            {vendedor.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vendedor.foto} alt={vendedor.nome} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-roxo/20 text-lg text-roxo-light">
                {vendedor.nome.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h2 className="font-display text-xl uppercase text-gelo">{vendedor.nome}</h2>
              <p className="text-xs text-gelo-dim">
                {vendedor.cargos.join(", ") || "—"} · <span className="capitalize">{vendedor.status}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Ligações" hoje={m.atividade.hoje.ligacoes} total={m.atividade.total.ligacoes} />
            <Stat label="Atendidas" hoje={m.atividade.hoje.atendidas} total={m.atividade.total.atendidas} />
            <Stat label="Decisores" hoje={m.atividade.hoje.decisores} total={m.atividade.total.decisores} />
            <Stat label="Reuniões" hoje={m.atividade.hoje.reunioes} total={m.atividade.total.reunioes} />
            <Stat label="WhatsApps" hoje={m.atividade.hoje.whatsapps} total={m.atividade.total.whatsapps} />
            <Stat label="Follow-ups" hoje={m.atividade.hoje.followupsCriados} total={m.atividade.total.followupsCriados} />
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-ink-line bg-ink p-3 text-center">
              <p className="text-[10px] uppercase text-gelo-dim">Tx. atendimento</p>
              <p className="mt-1 font-display text-lg text-gelo">{formatPct(m.atividade.taxaAtendimento)}</p>
            </div>
            <div className="rounded-xl border border-ink-line bg-ink p-3 text-center">
              <p className="text-[10px] uppercase text-gelo-dim">Tx. decisor</p>
              <p className="mt-1 font-display text-lg text-gelo">{formatPct(m.atividade.taxaDecisor)}</p>
            </div>
            <div className="rounded-xl border border-ink-line bg-ink p-3 text-center">
              <p className="text-[10px] uppercase text-gelo-dim">Tx. conversão</p>
              <p className="mt-1 font-display text-lg text-gelo">{formatPct(taxaConversao)}</p>
            </div>
          </div>

          {/* Pipeline atual */}
          <div className="mt-6">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">Pipeline atual</h4>
            <div className="flex flex-col gap-1.5">
              {LEAD_STAGES.map((s) => {
                const f = m.funil.find((x) => x.key === s.key);
                if (!f || f.total === 0) return null;
                return (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                    <span className="flex-1 text-gelo-dim">{s.label}</span>
                    <span className="text-gelo">{f.total}</span>
                  </div>
                );
              })}
              {m.funil.every((f) => f.total === 0) && <p className="text-sm text-gelo-dim/50">Sem leads no pipeline.</p>}
            </div>
          </div>

          {/* Últimos leads trabalhados */}
          <div className="mt-6">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">Últimos leads trabalhados</h4>
            {vendedor.leadsRecentes.length === 0 ? (
              <p className="text-sm text-gelo-dim/50">Nenhum lead ainda.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {vendedor.leadsRecentes.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm">
                    <span className="truncate text-gelo">{l.empresa || l.nome}</span>
                    <span className="shrink-0 text-[11px] text-gelo-dim">
                      {l.valorEstimado ? brl(Number(l.valorEstimado)) : LEAD_STAGES.find((s) => s.key === l.status)?.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Últimas atividades */}
          <div className="mt-6">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">Últimas atividades</h4>
            {vendedor.atividadesRecentes.length === 0 ? (
              <p className="text-sm text-gelo-dim/50">Nenhuma atividade ainda.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {vendedor.atividadesRecentes.map((a) => {
                  const Icon = ATIV_ICON[a.tipo] ?? PhoneCall;
                  return (
                    <li key={a.id} className="flex items-start gap-2 rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm">
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gelo-dim" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gelo">{a.texto}</p>
                        <p className="text-[10px] text-gelo-dim/60">{a.criadoEmLabel}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
