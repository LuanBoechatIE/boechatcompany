"use client";

import {
  KanbanBoard,
  type KanbanItem,
} from "@/app/components/admin/kanban/KanbanBoard";
import { DEMANDA_STATUS, type DemandaStatus } from "@/app/lib/crm/types";
import { updateDemandaStatus, deleteDemanda } from "../../crm-actions";

const COLUMNS = [
  { key: "backlog", label: "Backlog", accent: "bg-stone-400" },
  { key: "andamento", label: "Em andamento", accent: "bg-yellow-400" },
  { key: "revisao", label: "Revisão", accent: "bg-violet-400" },
  { key: "concluido", label: "Concluído", accent: "bg-emerald-400" },
];

export function DemandasBoard({ items }: { items: KanbanItem[] }) {
  // Garante que o label bata com as chaves das colunas.
  void DEMANDA_STATUS;
  return (
    <KanbanBoard
      columns={COLUMNS}
      items={items}
      updateStatus={(id, status) =>
        updateDemandaStatus(id, status as DemandaStatus)
      }
      deleteAction={deleteDemanda}
    />
  );
}
