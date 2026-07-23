"use client";

import { useEffect, useState } from "react";
import { Columns3, Table2, ListChecks, BarChart3 } from "lucide-react";
import type {
  LeadDTO,
  AtividadeDTO,
  ChecklistDTO,
  ArquivoDTO,
  LeadStatus,
} from "@/app/lib/crm/types";
import type { LeadsMetrics, FilaData } from "@/app/lib/crm/leads-data";
import { updateLeadStatus } from "../../crm-actions";
import { LeadStats } from "./LeadStats";
import { LeadsBoard } from "./LeadsBoard";
import { LeadsTableView } from "./LeadsTableView";
import { MinhaFilaView } from "./MinhaFilaView";
import { MetricasView } from "./MetricasView";
import { LeadDetail } from "./LeadDetail";

type View = "pipeline" | "tabela" | "metricas" | "fila";

const VIEWS: { key: View; label: string; icon: typeof Columns3 }[] = [
  { key: "pipeline", label: "Pipeline", icon: Columns3 },
  { key: "tabela", label: "Tabela", icon: Table2 },
  { key: "metricas", label: "Métricas", icon: BarChart3 },
  { key: "fila", label: "Minha fila", icon: ListChecks },
];

export function LeadsWorkspace({
  leads,
  atividadesPorLead,
  checklistPorLead,
  arquivosPorLead,
  metrics,
  fila,
}: {
  leads: LeadDTO[];
  atividadesPorLead: Record<number, AtividadeDTO[]>;
  checklistPorLead: Record<number, ChecklistDTO[]>;
  arquivosPorLead: Record<number, ArquivoDTO[]>;
  metrics: LeadsMetrics;
  fila: FilaData;
}) {
  const [view, setView] = useState<View>("pipeline");
  const [list, setList] = useState<LeadDTO[]>(leads);
  const [detalheId, setDetalheId] = useState<number | null>(null);

  useEffect(() => setList(leads), [leads]);

  function moveLead(id: number, status: LeadStatus) {
    setList((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    void updateLeadStatus(id, status);
  }

  const detalhe = list.find((l) => l.id === detalheId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <LeadStats metrics={metrics} />

      {/* Switcher de views */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-ink-line bg-ink-soft/40 p-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const ativo = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  ativo ? "bg-roxo text-white" : "text-gelo-dim hover:text-gelo"
                }`}
              >
                <Icon className="h-4 w-4" />
                {v.label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-gelo-dim/60">
          {list.length} {list.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      {view === "pipeline" && (
        <LeadsBoard leads={list} onMove={moveLead} onOpen={setDetalheId} />
      )}
      {view === "tabela" && <LeadsTableView leads={list} onOpen={setDetalheId} />}
      {view === "metricas" && <MetricasView metrics={metrics} />}
      {view === "fila" && <MinhaFilaView fila={fila} onOpen={setDetalheId} />}

      {detalhe && (
        <LeadDetail
          lead={detalhe}
          atividades={atividadesPorLead[detalhe.id] ?? []}
          checklist={checklistPorLead[detalhe.id] ?? []}
          arquivos={arquivosPorLead[detalhe.id] ?? []}
          onClose={() => setDetalheId(null)}
        />
      )}
    </div>
  );
}
