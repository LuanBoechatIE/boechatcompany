"use client";

import {
  KanbanBoard,
  type KanbanItem,
} from "@/app/components/admin/kanban/KanbanBoard";
import { type TarefaStatus } from "@/app/lib/crm/types";
import { updateTarefaStatus, deleteTarefa } from "../../../crm-actions";

const COLUMNS = [
  { key: "todo", label: "A fazer", accent: "bg-stone-400" },
  { key: "doing", label: "Fazendo", accent: "bg-yellow-400" },
  { key: "review", label: "Revisão", accent: "bg-violet-400" },
  { key: "done", label: "Concluído", accent: "bg-emerald-400" },
];

export function TarefasBoard({
  items,
  projetoId,
}: {
  items: KanbanItem[];
  projetoId: number;
}) {
  return (
    <KanbanBoard
      columns={COLUMNS}
      items={items}
      updateStatus={(id, status) =>
        updateTarefaStatus(id, status as TarefaStatus)
      }
      deleteAction={deleteTarefa}
      hiddenFields={{ projetoId }}
    />
  );
}
