"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Columns3, Table2, ListChecks, BarChart3, CheckSquare } from "lucide-react";
import type {
  LeadDTO,
  AtividadeDTO,
  ChecklistDTO,
  ArquivoDTO,
  LeadStatus,
} from "@/app/lib/crm/types";
import type { LeadsMetrics, FilaData, MetasDiarias } from "@/app/lib/crm/leads-data";
import { updateLeadStatus, acaoEmLote } from "../../crm-actions";
import { LeadStats } from "./LeadStats";
import { LeadsBoard } from "./LeadsBoard";
import { LeadsTableView } from "./LeadsTableView";
import { MinhaFilaView } from "./MinhaFilaView";
import { MetricasView } from "./MetricasView";
import { MinhaMeta } from "./MinhaMeta";
import { LeadAtendimento } from "./LeadAtendimento";
import { LeadContextMenu, type MenuState } from "./LeadContextMenu";
import { LeadsSelecaoBar } from "./LeadsSelecaoBar";
import { ModalMotivoPerda } from "./ModalMotivoPerda";

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
  podeReatribuir = true,
  podeEditarMetas = false,
}: {
  leads: LeadDTO[];
  atividadesPorLead: Record<number, AtividadeDTO[]>;
  checklistPorLead: Record<number, ChecklistDTO[]>;
  arquivosPorLead: Record<number, ArquivoDTO[]>;
  metrics: LeadsMetrics;
  fila: FilaData;
  metas: MetasDiarias;
  podeReatribuir?: boolean;
  podeEditarMetas?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("pipeline");
  const [list, setList] = useState<LeadDTO[]>(leads);
  const [detalheId, setDetalheId] = useState<number | null>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [selecao, setSelecao] = useState<Set<number>>(new Set());
  const [modoSelecao, setModoSelecao] = useState(false);
  // Perda pendente de motivo. Um id = veio do quadro ou do menu; vários = veio
  // da barra de seleção, e aí o mesmo motivo vale pro lote inteiro.
  const [perda, setPerda] = useState<{ ids: number[] } | null>(null);
  const [perdaErro, setPerdaErro] = useState<string | null>(null);
  const [perdaPendente, startPerda] = useTransition();

  useEffect(() => setList(leads), [leads]);

  // Seleção efetiva, derivada no render em vez de sincronizada por efeito. Se o
  // filtro muda e um lead selecionado sai da lista, ele deixa de contar sozinho,
  // sem cascata de render. Sem isso a barra agiria em lead que o usuário nem vê.
  const idsSelecionados = useMemo(() => {
    if (selecao.size === 0) return [];
    const visiveis = new Set(list.map((l) => l.id));
    return [...selecao].filter((id) => visiveis.has(id));
  }, [selecao, list]);

  const toggleSelecao = useCallback((id: number) => {
    setSelecao((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }, []);

  const marcarVarios = useCallback((ids: number[], marcar: boolean) => {
    setSelecao((prev) => {
      const s = new Set(prev);
      for (const id of ids) {
        if (marcar) s.add(id);
        else s.delete(id);
      }
      return s;
    });
  }, []);

  const limparSelecao = useCallback(() => setSelecao(new Set()), []);

  // Mover pra "perdido" não aplica direto: abre o pop-up de motivo. Como o
  // estado local só muda depois de confirmar, cancelar devolve o card pra
  // coluna de origem sozinho, sem precisar desfazer nada.
  const moveLead = useCallback((id: number, status: LeadStatus) => {
    if (status === "perdido") {
      setPerda({ ids: [id] });
      return;
    }
    setList((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    void updateLeadStatus(id, status);
  }, []);

  const confirmarPerda = useCallback(
    (motivo: string) => {
      if (!perda) return;
      setPerdaErro(null);
      startPerda(async () => {
        const ids = perda.ids;
        if (ids.length === 1) {
          const r = await updateLeadStatus(ids[0], "perdido", motivo);
          if (!r.ok) {
            setPerdaErro(r.erro ?? "Não foi possível marcar como perdido.");
            return;
          }
          setList((prev) =>
            prev.map((l) => (l.id === ids[0] ? { ...l, status: "perdido" as LeadStatus } : l)),
          );
        } else {
          const r = await acaoEmLote(ids, { tipo: "perdido", motivo });
          if (!r.ok) {
            setPerdaErro(r.erro ?? "Não foi possível marcar como perdido.");
            return;
          }
          limparSelecao();
        }
        setPerda(null);
        router.refresh();
      });
    },
    [perda, limparSelecao, router],
  );

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
      // Ctrl/Cmd+A marca tudo que está na tela (respeitando o filtro atual).
      // Liga o modo junto, senão os checkboxes ficariam escondidos com tudo
      // marcado, que é um estado confuso.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && !editando) {
        e.preventDefault();
        setModoSelecao(true);
        setSelecao(new Set(list.map((l) => l.id)));
        return;
      }
      if (e.key === "Escape") {
        setSelecao((prev) => (prev.size > 0 ? new Set() : prev));
        setModoSelecao(false);
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
  }, [list]);

  const detalheIndex = detalheId != null ? list.findIndex((l) => l.id === detalheId) : -1;
  const detalhe = detalheIndex >= 0 ? list[detalheIndex] : null;

  return (
    <div className="flex flex-col gap-5">
      <LeadStats metrics={metrics} />
      <MinhaMeta metas={metas} metrics={metrics} podeEditar={podeEditarMetas} />

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
        <div className="flex items-center gap-3">
          {(view === "pipeline" || view === "tabela") && list.length > 0 && (
            <>
              {/* Liga o modo seleção. Sem ele os checkboxes do quadro só
                  apareciam no hover, o que some em touch: no celular não existe
                  hover, então a seleção era literalmente inalcançável. */}
              <button
                onClick={() => {
                  if (modoSelecao) limparSelecao();
                  setModoSelecao((v) => !v);
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] transition-colors ${
                  modoSelecao
                    ? "border-roxo bg-roxo/15 text-roxo-light"
                    : "border-ink-line text-gelo-dim hover:text-gelo"
                }`}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                {modoSelecao ? "Cancelar" : "Selecionar"}
              </button>
              {modoSelecao && (
                <button
                  onClick={() =>
                    idsSelecionados.length === list.length
                      ? limparSelecao()
                      : setSelecao(new Set(list.map((l) => l.id)))
                  }
                  className="text-[11px] text-gelo-dim/60 transition-colors hover:text-roxo-light"
                >
                  {idsSelecionados.length === list.length
                    ? "Limpar seleção"
                    : `Marcar os ${list.length}`}
                </button>
              )}
            </>
          )}
          <span className="text-[11px] text-gelo-dim/60">
            {list.length} {list.length === 1 ? "lead" : "leads"}
          </span>
        </div>
      </div>

      {view === "pipeline" && (
        <LeadsBoard
          leads={list}
          onMove={moveLead}
          onOpen={setDetalheId}
          onContext={abrirMenu}
          selecao={selecao}
          onToggleSelecao={toggleSelecao}
          onSelecionarColuna={marcarVarios}
          modoSelecao={modoSelecao}
        />
      )}
      {view === "tabela" && (
        <LeadsTableView
          leads={list}
          onOpen={setDetalheId}
          onContext={abrirMenu}
          selecao={selecao}
          onToggle={toggleSelecao}
          onToggleFaixa={marcarVarios}
          onSelecionarTodos={(marcar) =>
            marcar ? setSelecao(new Set(list.map((l) => l.id))) : limparSelecao()
          }
          modoSelecao={modoSelecao}
        />
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
            podeReatribuir={podeReatribuir}
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

      <AnimatePresence>
        {idsSelecionados.length > 0 && (
          <LeadsSelecaoBar
            ids={idsSelecionados}
            podeReatribuir={podeReatribuir}
            onLimpar={limparSelecao}
            onPedirMotivoPerda={() => setPerda({ ids: idsSelecionados })}
            onAplicado={() => {
              limparSelecao();
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>

      {perda && (
        <ModalMotivoPerda
          quantidade={perda.ids.length}
          nome={
            perda.ids.length === 1
              ? (() => {
                  const l = list.find((x) => x.id === perda.ids[0]);
                  return l ? l.empresa || l.nome : undefined;
                })()
              : undefined
          }
          pendente={perdaPendente}
          erro={perdaErro}
          onConfirmar={confirmarPerda}
          onCancelar={() => {
            setPerda(null);
            setPerdaErro(null);
          }}
        />
      )}
    </div>
  );
}
