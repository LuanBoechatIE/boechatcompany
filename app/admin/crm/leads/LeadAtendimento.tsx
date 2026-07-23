"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Building2,
  Radio,
  UserCircle2,
  Clock,
  Repeat2,
  Tag,
} from "lucide-react";
import {
  LEAD_STAGES,
  tagsArray,
  type LeadDTO,
  type AtividadeDTO,
  type ChecklistDTO,
  type ArquivoDTO,
} from "@/app/lib/crm/types";
import { FluxoAtendimento } from "./FluxoAtendimento";
import {
  ScorePrioridade,
  FollowUpBar,
  ResumoForm,
  TimelineTab,
  ChecklistTab,
  ArquivosTab,
  TEMP_TEXT,
} from "./LeadTabs";

type Aba = "atendimento" | "timeline" | "editar";

const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

function Essencial({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gelo-dim/70" />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-wide text-gelo-dim/60">{label}</p>
        <p className="truncate text-[13px] text-gelo">{value || "—"}</p>
      </div>
    </div>
  );
}

export function LeadAtendimento({
  lead,
  index,
  total,
  atividades,
  checklist,
  arquivos,
  onPrev,
  onNext,
  onClose,
}: {
  lead: LeadDTO;
  index: number;
  total: number;
  atividades: AtividadeDTO[];
  checklist: ChecklistDTO[];
  arquivos: ArquivoDTO[];
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const [aba, setAba] = useState<Aba>("atendimento");
  const stage = LEAD_STAGES.find((s) => s.key === lead.status);
  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  const wpp = soDigitos(lead.whatsapp || lead.telefone);

  // Volta pra aba de atendimento ao trocar de lead.
  useEffect(() => setAba("atendimento"), [lead.id]);

  // Navegação por teclado (← → entre leads, Esc fecha).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasPrev, hasNext, onPrev, onNext, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Setas de navegação laterais */}
      <button
        onClick={onPrev}
        disabled={!hasPrev}
        className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-ink-soft/80 text-gelo-dim backdrop-blur hover:text-gelo disabled:opacity-30 sm:left-6"
        aria-label="Lead anterior"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={onNext}
        disabled={!hasNext}
        className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-ink-line bg-ink-soft/80 text-gelo-dim backdrop-blur hover:text-gelo disabled:opacity-30 sm:right-6"
        aria-label="Próximo lead"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <motion.div
        initial={{ scale: 0.96, opacity: 0.6, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-line bg-ink-soft shadow-2xl"
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 border-b border-ink-line p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${stage?.dot ?? "bg-gelo/40"}`} />
              <span className="text-xs uppercase tracking-wide text-gelo-dim">{stage?.label ?? lead.status}</span>
              <span className={`text-xs ${TEMP_TEXT[lead.temperatura]}`}>· score {lead.leadScore}</span>
            </div>
            <h2 className="mt-1 truncate font-display text-2xl uppercase text-gelo">{lead.empresa || lead.nome}</h2>
            {lead.empresa && lead.nome && lead.nome !== lead.empresa && (
              <p className="text-sm text-gelo-dim">{lead.nome}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <button onClick={onClose} className="rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
            <span className="whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] text-gelo-dim">
              Lead {index + 1} de {total}
            </span>
          </div>
        </div>

        {/* Essenciais */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-b border-ink-line px-5 py-3 sm:grid-cols-4">
          <Essencial icon={Phone} label="Telefone" value={lead.telefone} />
          <Essencial icon={MessageCircle} label="WhatsApp" value={lead.whatsapp} />
          <Essencial icon={Building2} label="Empresa" value={lead.empresa} />
          <Essencial icon={Radio} label="Origem" value={lead.origem} />
          <Essencial icon={UserCircle2} label="Responsável" value={lead.responsavel} />
          <Essencial icon={Clock} label="Criado há" value={`${lead.diasDesdeCriacao}d`} />
          <Essencial icon={Clock} label="Últ. interação" value={lead.ultimaInteracaoLabel ?? "—"} />
          <Essencial icon={Repeat2} label="Tentativas" value={String(lead.tentativas)} />
        </div>

        {tagsArray(lead.tags).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-ink-line px-5 py-2">
            <Tag className="h-3 w-3 text-gelo-dim/60" />
            {tagsArray(lead.tags).map((t) => (
              <span key={t} className="rounded-full bg-roxo/10 px-2 py-0.5 text-[10px] text-roxo-light">{t}</span>
            ))}
          </div>
        )}

        {/* Atalhos de contato */}
        <div className="flex gap-2 border-b border-ink-line px-5 py-2.5">
          {wpp && (
            <>
              <a href={`tel:${wpp}`} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo">
                <Phone className="h-3.5 w-3.5" /> Ligar
              </a>
              <a href={`https://wa.me/55${wpp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-emerald-300">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </>
          )}
          <div className="ml-auto flex gap-1">
            {(["atendimento", "timeline", "editar"] as Aba[]).map((a) => (
              <button
                key={a}
                onClick={() => setAba(a)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  aba === a ? "bg-roxo text-white" : "text-gelo-dim hover:text-gelo"
                }`}
              >
                {a === "atendimento" ? "Atendimento" : a === "timeline" ? `Timeline (${atividades.length})` : "Editar"}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {aba === "atendimento" && (
            <FluxoAtendimento lead={lead} hasNext={hasNext} onNext={onNext} onClose={onClose} />
          )}
          {aba === "timeline" && <TimelineTab lead={lead} atividades={atividades} />}
          {aba === "editar" && (
            <div className="flex flex-col gap-4">
              <ScorePrioridade lead={lead} />
              <FollowUpBar lead={lead} />
              <ResumoForm lead={lead} />
              <div className="border-t border-ink-line pt-4">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gelo-dim">Checklist</h4>
                <ChecklistTab lead={lead} checklist={checklist} />
              </div>
              <div className="border-t border-ink-line pt-4">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gelo-dim">Arquivos</h4>
                <ArquivosTab lead={lead} arquivos={arquivos} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
