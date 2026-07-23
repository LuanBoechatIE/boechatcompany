"use client";

import {
  Phone,
  Mail,
  User,
  Tag,
  Clock,
  Flame,
  Star,
  Banknote,
  MessageSquare,
  CalendarClock,
} from "lucide-react";
import {
  tagsArray,
  brl,
  LEAD_PRIORIDADES,
  type LeadDTO,
} from "@/app/lib/crm/types";

const brlOrNull = (v: string | null) => (v ? brl(Number(v)) : null);

// Cor do score/temperatura.
const TEMP_COR: Record<string, { bar: string; text: string }> = {
  quente: { bar: "bg-emerald-400", text: "text-emerald-300" },
  morno: { bar: "bg-yellow-400", text: "text-yellow-300" },
  frio: { bar: "bg-slate-400", text: "text-slate-300" },
};

function ScoreRing({ score, temperatura }: { score: number; temperatura: string }) {
  const cor = TEMP_COR[temperatura] ?? TEMP_COR.frio;
  return (
    <div
      className="flex shrink-0 flex-col items-end gap-1"
      title={`Lead score ${score}/100 · ${temperatura}`}
    >
      <span className={`font-display text-sm leading-none ${cor.text}`}>{score}</span>
      <span className="h-1 w-10 overflow-hidden rounded-full bg-ink-line">
        <span className={`block h-full rounded-full ${cor.bar}`} style={{ width: `${score}%` }} />
      </span>
    </div>
  );
}

// Faixinha de status à esquerda do card, comunicando o estado num relance.
function bordaEstado(lead: LeadDTO): string {
  if (lead.followUpStatus === "atrasado") return "border-l-red-500/70";
  if (lead.followUpStatus === "hoje") return "border-l-sky-400/70";
  if (lead.temperatura === "quente") return "border-l-emerald-400/60";
  if (lead.flags.includes("atencao")) return "border-l-yellow-400/50";
  return "border-l-ink-line";
}

export function LeadCard({
  lead,
  onOpen,
  dragging = false,
}: {
  lead: LeadDTO;
  onOpen?: (id: number) => void;
  dragging?: boolean;
}) {
  const titulo = lead.empresa || lead.nome;
  const valor = brlOrNull(lead.valorEstimado);
  const tags = tagsArray(lead.tags);
  const prioridade = LEAD_PRIORIDADES.find((p) => p.key === lead.prioridade);
  const mostraPrioridade = lead.prioridade === "alta" || lead.prioridade === "urgente";

  return (
    <div
      className={`rounded-xl border border-l-2 bg-ink p-3 transition-shadow ${bordaEstado(lead)} ${
        dragging ? "border-roxo/50 shadow-2xl" : "border-ink-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(lead.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-gelo hover:text-roxo-light">
            {titulo}
          </p>
          {lead.empresa && lead.nome && lead.nome !== lead.empresa && (
            <p className="truncate text-[11px] text-gelo-dim">{lead.nome}</p>
          )}
        </button>
        <ScoreRing score={lead.leadScore} temperatura={lead.temperatura} />
      </div>

      {/* Indicadores rápidos */}
      {(lead.flags.length > 0 || mostraPrioridade) && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {mostraPrioridade && prioridade && (
            <span
              className="flex items-center gap-1 rounded-full bg-ink-soft px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-gelo-dim"
              title={`Prioridade ${prioridade.label}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${prioridade.dot}`} />
              {prioridade.label}
            </span>
          )}
          {lead.flags.includes("quente") && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300" title="Lead quente">
              <Flame className="h-2.5 w-2.5" /> quente
            </span>
          )}
          {lead.flags.includes("potencial") && valor && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-200/90" title="Alto potencial">
              <Banknote className="h-2.5 w-2.5" /> {valor}
            </span>
          )}
          {lead.flags.includes("atencao") && (
            <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/10 px-1.5 py-0.5 text-[9px] text-yellow-300" title="Precisa de atenção">
              <Star className="h-2.5 w-2.5" /> atenção
            </span>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-col gap-1 text-[11px] text-gelo-dim">
        {lead.pessoaContato && (
          <span className="flex items-center gap-1.5">
            <User className="h-3 w-3" /> {lead.pessoaContato}
          </span>
        )}
        {(lead.telefone || lead.whatsapp) && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" /> {lead.telefone || lead.whatsapp}
          </span>
        )}
        {lead.email && (
          <span className="flex items-center gap-1.5 truncate">
            <Mail className="h-3 w-3 shrink-0" /> {lead.email}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.servico && (
          <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] text-gelo-dim">
            {lead.servico}
          </span>
        )}
        {valor && !lead.flags.includes("potencial") && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-200/90">
            <Banknote className="h-3 w-3" /> {valor}
          </span>
        )}
        {lead.origem && (
          <span className="text-[10px] text-gelo-dim/70">{lead.origem}</span>
        )}
      </div>

      {/* Follow-up */}
      {(lead.proximaAcao || lead.proximoContatoLabel) && (
        <div
          className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] ${
            lead.followUpStatus === "atrasado"
              ? "border-red-500/30 bg-red-500/5 text-red-300"
              : lead.followUpStatus === "hoje"
                ? "border-sky-500/30 bg-sky-500/5 text-sky-300"
                : "border-ink-line bg-ink-soft/40 text-gelo-dim"
          }`}
        >
          <CalendarClock className="h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">
            {lead.proximaAcao || "Próximo contato"}
            {lead.proximoContatoLabel ? ` · ${lead.proximoContatoLabel}` : ""}
          </span>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.responsavel && (
          <span className="rounded-full bg-ink-soft px-2 py-0.5 text-[10px] text-gelo-dim">
            {lead.responsavel}
          </span>
        )}
        {tags.slice(0, 2).map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-roxo/10 px-2 py-0.5 text-[10px] text-roxo-light"
          >
            <Tag className="h-2.5 w-2.5" />
            {t}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-[10px] text-gelo-dim/50">
          {lead.numInteracoes > 0 && (
            <span className="flex items-center gap-0.5" title={`${lead.numInteracoes} interações`}>
              <MessageSquare className="h-2.5 w-2.5" />
              {lead.numInteracoes}
            </span>
          )}
          <span className="flex items-center gap-0.5" title="Última interação">
            <Clock className="h-2.5 w-2.5" />
            {lead.ultimaInteracaoLabel ?? "sem contato"}
          </span>
        </span>
      </div>
    </div>
  );
}
