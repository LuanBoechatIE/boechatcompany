"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  LEAD_STAGES,
  LEAD_PRIORIDADES,
  brl,
  type LeadDTO,
} from "@/app/lib/crm/types";

const STAGE = Object.fromEntries(LEAD_STAGES.map((s) => [s.key, s]));
const PRIO = Object.fromEntries(LEAD_PRIORIDADES.map((p) => [p.key, p]));

type SortKey = "titulo" | "status" | "responsavel" | "valor" | "score" | "interacao" | "followup";

const TEMP_TEXT: Record<string, string> = {
  quente: "text-emerald-300",
  morno: "text-yellow-300",
  frio: "text-slate-300",
};

function followUpCell(l: LeadDTO) {
  if (!l.proximoContatoLabel)
    return <span className="text-gelo-dim/40">—</span>;
  const cor =
    l.followUpStatus === "atrasado"
      ? "text-red-300"
      : l.followUpStatus === "hoje"
        ? "text-sky-300"
        : "text-gelo-dim";
  return <span className={cor}>{l.proximoContatoLabel}</span>;
}

// Fora do render: componente declarado dentro do corpo é remontado a cada
// re-render (perde estado e quebra a regra react-hooks/static-components).
function Th({
  k,
  label,
  right = false,
  ativo,
  onSort,
}: {
  k: SortKey;
  label: string;
  right?: boolean;
  ativo: boolean;
  onSort: (k: SortKey) => void;
}) {
  return (
    <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-gelo ${ativo ? "text-gelo" : ""}`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );
}

export function LeadsTableView({
  leads,
  onOpen,
  onContext,
  selecao,
  onToggle,
  onToggleFaixa,
  onSelecionarTodos,
}: {
  leads: LeadDTO[];
  onOpen: (id: number) => void;
  onContext: (e: React.MouseEvent, id: number) => void;
  selecao: Set<number>;
  onToggle: (id: number) => void;
  onToggleFaixa: (ids: number[], marcar: boolean) => void;
  onSelecionarTodos: (marcar: boolean) => void;
}) {
  const [sort, setSort] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);
  // Âncora do shift-click, na ordem em que a tabela está exibida agora.
  const [ancora, setAncora] = useState<number | null>(null);

  const valor = (l: LeadDTO) => (l.valorEstimado ? Number(l.valorEstimado) : 0);
  const ordenar = (a: LeadDTO, b: LeadDTO): number => {
    let d = 0;
    switch (sort) {
      case "titulo":
        d = (a.empresa || a.nome).localeCompare(b.empresa || b.nome);
        break;
      case "status":
        d = LEAD_STAGES.findIndex((s) => s.key === a.status) - LEAD_STAGES.findIndex((s) => s.key === b.status);
        break;
      case "responsavel":
        d = a.responsavel.localeCompare(b.responsavel);
        break;
      case "valor":
        d = valor(a) - valor(b);
        break;
      case "score":
        d = a.leadScore - b.leadScore;
        break;
      case "interacao":
        d = (a.ultimaInteracaoMs ?? 0) - (b.ultimaInteracaoMs ?? 0);
        break;
      case "followup":
        d = (a.proximoContatoMs ?? Infinity) - (b.proximoContatoMs ?? Infinity);
        break;
    }
    return asc ? d : -d;
  };

  const linhas = [...leads].sort(ordenar);

  const todosMarcados = linhas.length > 0 && linhas.every((l) => selecao.has(l.id));
  const algunsMarcados = !todosMarcados && linhas.some((l) => selecao.has(l.id));

  // Shift-click seleciona da última linha clicada até esta, como em planilha.
  const clicarLinha = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (e.shiftKey && ancora != null) {
      const i = linhas.findIndex((l) => l.id === ancora);
      const j = linhas.findIndex((l) => l.id === id);
      if (i >= 0 && j >= 0) {
        const [de, ate] = i < j ? [i, j] : [j, i];
        onToggleFaixa(
          linhas.slice(de, ate + 1).map((l) => l.id),
          !selecao.has(id),
        );
        return;
      }
    }
    setAncora(id);
    onToggle(id);
  };

  const toggleSort = (k: SortKey) => {
    if (sort === k) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(false);
    }
  };

  const th = (k: SortKey, label: string, right = false) => (
    <Th k={k} label={label} right={right} ativo={sort === k} onSort={toggleSort} />
  );

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-line bg-ink-soft/25 py-16 text-center text-sm text-gelo-dim/50">
        Nenhum lead encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-line bg-ink-soft/25">
      <table className="w-full min-w-[52rem] text-sm">
        <thead className="border-b border-ink-line text-[11px] uppercase tracking-wide text-gelo-dim">
          <tr>
            <th className="w-9 px-3 py-2">
              <input
                type="checkbox"
                aria-label="Selecionar todos os leads da lista"
                checked={todosMarcados}
                ref={(el) => {
                  if (el) el.indeterminate = algunsMarcados;
                }}
                onChange={(e) => onSelecionarTodos(e.target.checked)}
                className="h-3.5 w-3.5 cursor-pointer accent-roxo"
              />
            </th>
            {th("titulo", "Lead")}
            {th("status", "Etapa")}
            <th className="px-3 py-2 text-left font-medium">Prioridade</th>
            {th("responsavel", "Responsável")}
            {th("valor", "Valor", true)}
            {th("score", "Score", true)}
            {th("interacao", "Últ. interação")}
            {th("followup", "Follow-up")}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const stage = STAGE[l.status];
            const prio = PRIO[l.prioridade];
            const marcado = selecao.has(l.id);
            return (
              <tr
                key={l.id}
                onClick={() => onOpen(l.id)}
                onContextMenu={(e) => onContext(e, l.id)}
                className={`cursor-pointer border-b border-ink-line/50 last:border-0 hover:bg-ink-soft/50 ${
                  marcado ? "bg-roxo/10" : ""
                }`}
              >
                <td className="px-3 py-2.5" onClick={(e) => clicarLinha(e, l.id)}>
                  <input
                    type="checkbox"
                    aria-label={`Selecionar ${l.empresa || l.nome}`}
                    checked={marcado}
                    onChange={() => {}}
                    onClick={(e) => clicarLinha(e, l.id)}
                    className="h-3.5 w-3.5 cursor-pointer accent-roxo"
                  />
                </td>
                <td className="max-w-[16rem] px-3 py-2.5">
                  <div className="truncate font-medium text-gelo">{l.empresa || l.nome}</div>
                  {l.pessoaContato && (
                    <div className="truncate text-[11px] text-gelo-dim">{l.pessoaContato}</div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gelo-dim">
                    <span className={`h-2 w-2 rounded-full ${stage?.dot ?? "bg-gelo/40"}`} />
                    {stage?.label ?? l.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {prio && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-gelo-dim">
                      <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
                      {prio.label}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gelo-dim">{l.responsavel || "—"}</td>
                <td className="px-3 py-2.5 text-right text-gelo-dim">
                  {l.valorEstimado ? brl(Number(l.valorEstimado)) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`font-display ${TEMP_TEXT[l.temperatura] ?? "text-gelo"}`}>
                    {l.leadScore}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gelo-dim">
                  {l.ultimaInteracaoLabel ?? <span className="text-gelo-dim/40">sem contato</span>}
                </td>
                <td className="px-3 py-2.5">{followUpCell(l)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
