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
import { Trash2, X, CalendarDays, User } from "lucide-react";
import { PRIORIDADE_CLS, type Prioridade } from "@/app/lib/crm/types";

export type KanbanItem = {
  id: number;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  prioridade?: string;
  status: string;
  subtitulo?: string;
  prazo?: string; // já formatado (ex.: "22/07/2026")
};

export type KanbanColumn = { key: string; label: string; accent: string };

type Props = {
  columns: KanbanColumn[];
  items: KanbanItem[];
  updateStatus: (id: number, status: string) => Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string | number>;
};

// Divide "Luan, Samuel" em ["Luan","Samuel"].
function pessoas(responsavel?: string): string[] {
  return (responsavel ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function Card({
  item,
  deleteAction,
  hiddenFields,
  onOpen,
  dragging = false,
}: {
  item: KanbanItem;
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
  onOpen?: (item: KanbanItem) => void;
  dragging?: boolean;
}) {
  const prioridade = (item.prioridade ?? "media") as Prioridade;
  const resp = pessoas(item.responsavel);
  return (
    <div
      className={`rounded-xl border border-ink-line bg-ink p-3 ${
        dragging ? "shadow-2xl" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen?.(item)}
          onPointerDown={(e) => e.stopPropagation()}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-medium text-gelo hover:text-roxo-light">
            {item.titulo}
          </p>
        </button>
        {!dragging && (
          <form action={deleteAction}>
            <input type="hidden" name="id" value={item.id} />
            {hiddenFields &&
              Object.entries(hiddenFields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <button
              className="shrink-0 rounded-md p-1 text-red-300/60 hover:text-red-300"
              aria-label="Excluir"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
      {item.subtitulo && (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-roxo-light">
          {item.subtitulo}
        </p>
      )}
      {item.descricao && (
        <p className="mt-1 line-clamp-2 text-xs text-gelo-dim">{item.descricao}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
            PRIORIDADE_CLS[prioridade] ?? PRIORIDADE_CLS.media
          }`}
        >
          {prioridade}
        </span>
        {item.prazo && (
          <span className="flex items-center gap-1 text-[10px] text-gelo-dim">
            <CalendarDays className="h-3 w-3" />
            {item.prazo}
          </span>
        )}
        {resp.map((p) => (
          <span
            key={p}
            className="rounded-full bg-ink-soft px-2 py-0.5 text-[10px] text-gelo-dim"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function DraggableCard(props: {
  item: KanbanItem;
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
  onOpen: (item: KanbanItem) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(props.item.id),
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
      <Card {...props} />
    </div>
  );
}

function Column({
  column,
  items,
  deleteAction,
  hiddenFields,
  onOpen,
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
  onOpen: (item: KanbanItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[8rem] flex-col gap-2 rounded-2xl border bg-ink-soft/30 p-3 transition-colors ${
        isOver ? "border-roxo-light/50 bg-ink-soft/50" : "border-ink-line"
      }`}
    >
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className={`h-2 w-2 rounded-full ${column.accent}`} />
        <span className="text-xs font-medium uppercase tracking-wide text-gelo-dim">
          {column.label}
        </span>
        <span className="ml-auto text-xs text-gelo-dim/60">{items.length}</span>
      </div>
      {items.map((item) => (
        <DraggableCard
          key={item.id}
          item={item}
          deleteAction={deleteAction}
          hiddenFields={hiddenFields}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function DetalheModal({
  item,
  statusLabel,
  onClose,
}: {
  item: KanbanItem;
  statusLabel: string;
  onClose: () => void;
}) {
  const prioridade = (item.prioridade ?? "media") as Prioridade;
  const resp = pessoas(item.responsavel);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-ink-line bg-ink-soft p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {item.subtitulo && (
              <p className="text-xs uppercase tracking-wide text-roxo-light">
                {item.subtitulo}
              </p>
            )}
            <h2 className="mt-1 font-display text-2xl uppercase leading-tight text-gelo">
              {item.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
            {statusLabel}
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
              PRIORIDADE_CLS[prioridade] ?? PRIORIDADE_CLS.media
            }`}
          >
            {prioridade}
          </span>
          {item.prazo && (
            <span className="flex items-center gap-1.5 rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
              <CalendarDays className="h-3.5 w-3.5" />
              {item.prazo}
            </span>
          )}
        </div>

        {resp.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs uppercase tracking-wide text-gelo-dim">
              Responsáveis
            </p>
            <div className="flex flex-wrap gap-2">
              {resp.map((p) => (
                <span
                  key={p}
                  className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-sm text-gelo"
                >
                  <User className="h-3.5 w-3.5 text-roxo-light" />
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-1.5 text-xs uppercase tracking-wide text-gelo-dim">
            Descrição
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gelo">
            {item.descricao?.trim() || "Sem descrição."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({
  columns,
  items,
  updateStatus,
  deleteAction,
  hiddenFields,
}: Props) {
  const [state, setState] = useState<KanbanItem[]>(items);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [detalheId, setDetalheId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columnKeys = new Set(columns.map((c) => c.key));

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const id = Number(active.id);
    const overId = String(over.id);
    const novoStatus = columnKeys.has(overId)
      ? overId
      : state.find((i) => i.id === Number(overId))?.status;
    if (!novoStatus) return;
    const atual = state.find((i) => i.id === id);
    if (!atual || atual.status === novoStatus) return;

    setState((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: novoStatus } : i)),
    );
    void updateStatus(id, novoStatus);
  }

  const activeItem = state.find((i) => i.id === activeId) ?? null;
  const detalhe = state.find((i) => i.id === detalheId) ?? null;
  const detalheStatusLabel =
    columns.find((c) => c.key === detalhe?.status)?.label ?? detalhe?.status ?? "";

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(Number(active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <Column
              key={col.key}
              column={col}
              items={state.filter((i) => i.status === col.key)}
              deleteAction={deleteAction}
              hiddenFields={hiddenFields}
              onOpen={(it) => setDetalheId(it.id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeItem ? (
            <Card item={activeItem} deleteAction={deleteAction} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {detalhe && (
        <DetalheModal
          item={detalhe}
          statusLabel={detalheStatusLabel}
          onClose={() => setDetalheId(null)}
        />
      )}
    </>
  );
}
