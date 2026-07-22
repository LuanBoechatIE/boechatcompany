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
import { Trash2 } from "lucide-react";
import { PRIORIDADE_CLS, type Prioridade } from "@/app/lib/crm/types";

export type KanbanItem = {
  id: number;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  prioridade?: string;
  status: string;
  subtitulo?: string;
};

export type KanbanColumn = { key: string; label: string; accent: string };

type Props = {
  columns: KanbanColumn[];
  items: KanbanItem[];
  updateStatus: (id: number, status: string) => Promise<void>;
  deleteAction: (formData: FormData) => void | Promise<void>;
  hiddenFields?: Record<string, string | number>;
};

function Card({
  item,
  deleteAction,
  hiddenFields,
  dragging = false,
}: {
  item: KanbanItem;
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
  dragging?: boolean;
}) {
  const prioridade = (item.prioridade ?? "media") as Prioridade;
  return (
    <div
      className={`rounded-xl border border-ink-line bg-ink p-3 ${
        dragging ? "shadow-2xl" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-gelo">{item.titulo}</p>
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
              // Impede o pointer sensor de iniciar drag ao clicar no botão
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
      </div>
      {item.subtitulo && (
        <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-roxo-light">
          {item.subtitulo}
        </p>
      )}
      {item.descricao && (
        <p className="mt-1 line-clamp-2 text-xs text-gelo-dim">{item.descricao}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
            PRIORIDADE_CLS[prioridade] ?? PRIORIDADE_CLS.media
          }`}
        >
          {prioridade}
        </span>
        {item.responsavel && (
          <span className="text-[10px] text-gelo-dim">{item.responsavel}</span>
        )}
      </div>
    </div>
  );
}

function DraggableCard(props: {
  item: KanbanItem;
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
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
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  deleteAction: Props["deleteAction"];
  hiddenFields?: Props["hiddenFields"];
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
        />
      ))}
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

  return (
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
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <Card item={activeItem} deleteAction={deleteAction} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
