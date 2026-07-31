"use client";

import { useRef, useState } from "react";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  onContext,
  selecionado,
  onToggleSelecao,
  modoSelecao,
}: {
  lead: LeadDTO;
  onOpen: (id: number) => void;
  onContext: (e: React.MouseEvent, id: number) => void;
  selecionado: boolean;
  onToggleSelecao: (id: number) => void;
  modoSelecao: boolean;
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
      <LeadCard
        lead={lead}
        onOpen={onOpen}
        onContext={onContext}
        selecionado={selecionado}
        onToggleSelecao={onToggleSelecao}
        modoSelecao={modoSelecao}
      />
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
  onContext,
  selecao,
  onToggleSelecao,
  onSelecionarColuna,
  modoSelecao,
}: {
  stageKey: string;
  label: string;
  accent: string;
  leads: LeadDTO[];
  total: string | null;
  onOpen: (id: number) => void;
  onContext: (e: React.MouseEvent, id: number) => void;
  selecao: Set<number>;
  onToggleSelecao: (id: number) => void;
  onSelecionarColuna: (ids: number[], marcar: boolean) => void;
  modoSelecao: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageKey });
  const todosMarcados = leads.length > 0 && leads.every((l) => selecao.has(l.id));
  return (
    <div className="group/col flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-gelo">
          {label}
        </span>
        {/* Marca a coluna inteira. Útil pra "todo mundo que está em Novo". */}
        {leads.length > 0 && (
          <button
            onClick={() =>
              onSelecionarColuna(
                leads.map((l) => l.id),
                !todosMarcados,
              )
            }
            className={`text-[10px] transition-opacity hover:text-roxo-light ${
              todosMarcados
                ? "text-roxo-light opacity-100"
                : `text-gelo-dim/60 ${modoSelecao ? "opacity-100" : "opacity-0 group-hover/col:opacity-100"}`
            }`}
          >
            {todosMarcados ? "limpar" : "sel. tudo"}
          </button>
        )}
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
          <DraggableLead
            key={l.id}
            lead={l}
            onOpen={onOpen}
            onContext={onContext}
            selecionado={selecao.has(l.id)}
            onToggleSelecao={onToggleSelecao}
            modoSelecao={modoSelecao}
          />
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
  onContext,
  selecao,
  onToggleSelecao,
  onSelecionarColuna,
  modoSelecao,
}: {
  leads: LeadDTO[];
  onMove: (id: number, status: LeadStatus) => void;
  onOpen: (id: number) => void;
  onContext: (e: React.MouseEvent, id: number) => void;
  selecao: Set<number>;
  onToggleSelecao: (id: number) => void;
  onSelecionarColuna: (ids: number[], marcar: boolean) => void;
  modoSelecao: boolean;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rolar = (dir: -1 | 1) =>
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

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

  // Cada coluna vem ordenada por score, do maior pro menor. Sem isso o Kanban
  // herdava a ordem do banco (mais recente primeiro), então quem trabalha a
  // coluna "Novo" de cima pra baixo ligava por ordem de cadastro em vez de
  // ordem de prioridade — que é justamente o que o score existe pra resolver.
  // `leadScore` já respeita o override manual (scoreFixo) na camada de dados.
  // Empate desempata por nome, pra a ordem não dançar entre renders.
  const daColuna = (key: string) =>
    leads
      .filter((l) => l.status === key)
      .sort(
        (a, b) =>
          b.leadScore - a.leadScore ||
          (a.empresa || a.nome).localeCompare(b.empresa || b.nome),
      );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(Number(active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="group/board relative">
        {/* Navegação horizontal sem arrastar */}
        <button
          onClick={() => rolar(-1)}
          className="absolute -left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-line bg-ink-soft/90 text-gelo-dim opacity-0 shadow-lg backdrop-blur transition-opacity hover:text-gelo group-hover/board:opacity-100"
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => rolar(1)}
          className="absolute -right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-ink-line bg-ink-soft/90 text-gelo-dim opacity-0 shadow-lg backdrop-blur transition-opacity hover:text-gelo group-hover/board:opacity-100"
          aria-label="Rolar para a direita"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {LEAD_STAGES.map((stage) => (
            <Coluna
              key={stage.key}
              stageKey={stage.key}
              label={stage.label}
              accent={stage.accent}
              leads={daColuna(stage.key)}
              total={somaColuna(stage.key)}
              onOpen={onOpen}
              onContext={onContext}
              selecao={selecao}
              onToggleSelecao={onToggleSelecao}
              onSelecionarColuna={onSelecionarColuna}
              modoSelecao={modoSelecao}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
