"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  Phone,
  Mail,
  User,
  Tag,
  Clock,
  AlertTriangle,
  Banknote,
} from "lucide-react";
import {
  LEAD_STAGES,
  tagsArray,
  brl,
  type LeadDTO,
  type AtividadeDTO,
  type LeadStatus,
} from "@/app/lib/crm/types";
import { updateLeadStatus } from "../../crm-actions";
import { LeadDetail } from "./LeadDetail";

const brlOrNull = (v: string | null) => (v ? brl(Number(v)) : null);

function LeadCard({
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
  return (
    <div
      className={`rounded-xl border bg-ink p-3 ${
        dragging
          ? "border-roxo/50 shadow-2xl"
          : lead.atrasado
            ? "border-red-500/40"
            : "border-ink-line"
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
        {lead.atrasado && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-300"
            title="Atividade vencida"
          >
            <AlertTriangle className="h-3 w-3" />
            atraso
          </span>
        )}
      </div>

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
        {valor && (
          <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-200/90">
            <Banknote className="h-3 w-3" /> {valor}
          </span>
        )}
        {lead.origem && (
          <span className="text-[10px] text-gelo-dim/70">{lead.origem}</span>
        )}
      </div>

      {(lead.proximaAcao || lead.proximoContatoLabel) && (
        <div
          className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] ${
            lead.atrasado
              ? "border-red-500/30 bg-red-500/5 text-red-300"
              : "border-ink-line bg-ink-soft/40 text-gelo-dim"
          }`}
        >
          <Clock className="h-3 w-3 shrink-0" />
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
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-roxo/10 px-2 py-0.5 text-[10px] text-roxo-light"
          >
            <Tag className="h-2.5 w-2.5" />
            {t}
          </span>
        ))}
        <span className="ml-auto text-[10px] text-gelo-dim/50">
          {lead.criadoEmLabel}
        </span>
      </div>
    </div>
  );
}

function DraggableLead({
  lead,
  onOpen,
}: {
  lead: LeadDTO;
  onOpen: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(lead.id),
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab touch-none active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <LeadCard lead={lead} onOpen={onOpen} />
    </div>
  );
}

function Coluna({
  stageKey,
  label,
  accent,
  leads,
  total,
  onOpen,
}: {
  stageKey: string;
  label: string;
  accent: string;
  leads: LeadDTO[];
  total: string | null;
  onOpen: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-gelo">
          {label}
        </span>
        <span className="ml-auto text-[11px] text-gelo-dim/60">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[10rem] flex-1 flex-col gap-2 rounded-2xl border p-2 transition-colors ${
          isOver ? "border-roxo-light/50 bg-ink-soft/50" : "border-ink-line bg-ink-soft/25"
        }`}
      >
        {leads.map((l) => (
          <DraggableLead key={l.id} lead={l} onOpen={onOpen} />
        ))}
        {leads.length === 0 && (
          <p className="py-6 text-center text-[11px] text-gelo-dim/40">Vazio</p>
        )}
      </div>
      {total && (
        <div className="mt-1 px-1 text-right text-[10px] text-gelo-dim/60">
          {total}
        </div>
      )}
    </div>
  );
}

export function LeadsBoard({
  leads,
  atividadesPorLead,
}: {
  leads: LeadDTO[];
  atividadesPorLead: Record<number, AtividadeDTO[]>;
}) {
  const [state, setState] = useState<LeadDTO[]>(leads);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detalheId, setDetalheId] = useState<number | null>(null);

  useEffect(() => setState(leads), [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const stageKeys = new Set<string>(LEAD_STAGES.map((s) => s.key));

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const id = Number(active.id);
    const overId = String(over.id);
    const novo = stageKeys.has(overId)
      ? overId
      : state.find((l) => l.id === Number(overId))?.status;
    if (!novo) return;
    const atual = state.find((l) => l.id === id);
    if (!atual || atual.status === novo) return;
    setState((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: novo as LeadStatus } : l)),
    );
    void updateLeadStatus(id, novo as LeadStatus);
  }

  const activeLead = state.find((l) => l.id === activeId) ?? null;
  const detalhe = state.find((l) => l.id === detalheId) ?? null;

  const somaColuna = (key: string) => {
    const s = state
      .filter((l) => l.status === key && l.valorEstimado)
      .reduce((acc, l) => acc + Number(l.valorEstimado), 0);
    return s > 0 ? brl(s) : null;
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(Number(active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-3">
          {LEAD_STAGES.map((stage) => (
            <Coluna
              key={stage.key}
              stageKey={stage.key}
              label={stage.label}
              accent={stage.accent}
              leads={state.filter((l) => l.status === stage.key)}
              total={somaColuna(stage.key)}
              onOpen={setDetalheId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
        </DragOverlay>
      </DndContext>

      {detalhe && (
        <LeadDetail
          lead={detalhe}
          atividades={atividadesPorLead[detalhe.id] ?? []}
          onClose={() => setDetalheId(null)}
        />
      )}
    </>
  );
}
