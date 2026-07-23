"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Columns3, Table2, ListChecks, BarChart3 } from "lucide-react";
import type {
  LeadDTO,
  AtividadeDTO,
  ChecklistDTO,
  ArquivoDTO,
  LeadStatus,
} from "@/app/lib/crm/types";
import type { LeadsMetrics, FilaData, MetasDiarias } from "@/app/lib/crm/leads-data";
import { updateLeadStatus } from "../../crm-actions";
import { LeadStats } from "./LeadStats";
import { LeadsBoard } from "./LeadsBoard";
import { LeadsTableView } from "./LeadsTableView";
import { MinhaFilaView } from "./MinhaFilaView";
import { MetricasView } from "./MetricasView";
import { MinhaMeta } from "./MinhaMeta";
import { LeadAtendimento } from "./LeadAtendimento";
import { LeadContextMenu, type MenuState } from "./LeadContextMenu";

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
  metas,
}: {
  leads: LeadDTO[];
  atividadesPorLead: Record<number, AtividadeDTO[]>;
  checklistPorLead: Record<number, ChecklistDTO[]>;
  arquivosPorLead: Record<number, ArquivoDTO[]>;
  metrics: LeadsMetrics;
  fila: FilaData;
  metas: MetasDiarias;
}) {
  const [view, setView] = useState<View>("pipeline");
  const [list, setList] = useState<LeadDTO[]>(leads);
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => setList(leads), [leads]);

  const moveLead = useCallback((id: number, status: LeadStatus) => {
    setList((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    void updateLeadStatus(id, status);
  }, []);

  const abrirMenu = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      const lead = list.find((l) => l.id === id);
      if (lead) setMenu({ lead, x: e.clientX, y: e.clientY });
    },
    [list],
  );

  // Atalhos de teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const editando = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !editando) {
        e.preventDefault();
        document.getElementById("lead-search")?.focus();
        return;
      }
      if (editando) return;
      if (e.key === "n") {
        window.dispatchEvent(new CustomEvent("lead:novo"));
      } else if (e.key === "1") setView("pipeline");
      else if (e.key === "2") setView("tabela");
      else if (e.key === "3") setView("metricas");
      else if (e.key === "4") setView("fila");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const detalheIndex = detalheId != null ? list.findIndex((l) => l.id === detalheId) : -1;
  const detalhe = detalheIndex >= 0 ? list[detalheIndex] : null;

  return (
    <div className="flex flex-col gap-5">
      <LeadStats metrics={metrics} />
      <MinhaMeta metas={metas} metrics={metrics} />

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
        <LeadsBoard leads={list} onMove={moveLead} onOpen={setDetalheId} onContext={abrirMenu} />
      )}
      {view === "tabela" && (
        <LeadsTableView leads={list} onOpen={setDetalheId} onContext={abrirMenu} />
      )}
      {view === "metricas" && <MetricasView metrics={metrics} />}
      {view === "fila" && <MinhaFilaView fila={fila} onOpen={setDetalheId} />}

      <AnimatePresence>
        {detalhe && (
          <LeadAtendimento
            key={detalhe.id}
            lead={detalhe}
            index={detalheIndex}
            total={list.length}
            atividades={atividadesPorLead[detalhe.id] ?? []}
            checklist={checklistPorLead[detalhe.id] ?? []}
            arquivos={arquivosPorLead[detalhe.id] ?? []}
            onPrev={() => {
              if (detalheIndex > 0) setDetalheId(list[detalheIndex - 1].id);
            }}
            onNext={() => {
              if (detalheIndex < list.length - 1) setDetalheId(list[detalheIndex + 1].id);
            }}
            onClose={() => setDetalheId(null)}
          />
        )}
      </AnimatePresence>

      {menu && (
        <LeadContextMenu
          state={menu}
          onClose={() => setMenu(null)}
          onOpen={setDetalheId}
          onMove={moveLead}
        />
      )}
    </div>
  );
}
