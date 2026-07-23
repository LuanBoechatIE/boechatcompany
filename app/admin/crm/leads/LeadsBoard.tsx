"use client";

import { useState } from "react";
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
  LEAD_STAGES,
  brl,
  type LeadDTO,
  type LeadStatus,
} from "@/app/lib/crm/types";
import { LeadCard } from "./LeadCard";

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
  onMove,
  onOpen,
}: {
  leads: LeadDTO[];
  onMove: (id: number, status: LeadStatus) => void;
  onOpen: (id: number) => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);

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
      : leads.find((l) => l.id === Number(overId))?.status;
    if (!novo) return;
    const atual = leads.find((l) => l.id === id);
    if (!atual || atual.status === novo) return;
    onMove(id, novo as LeadStatus);
  }

  const activeLead = leads.find((l) => l.id === activeId) ?? null;

  const somaColuna = (key: string) => {
    const s = leads
      .filter((l) => l.status === key && l.valorEstimado)
      .reduce((acc, l) => acc + Number(l.valorEstimado), 0);
    return s > 0 ? brl(s) : null;
  };

  return (
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
            leads={leads.filter((l) => l.status === stage.key)}
            total={somaColuna(stage.key)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
