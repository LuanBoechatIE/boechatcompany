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

export function LeadsTableView({
  leads,
  onOpen,
  onContext,
}: {
  leads: LeadDTO[];
  onOpen: (id: number) => void;
  onContext: (e: React.MouseEvent, id: number) => void;
}) {
  const [sort, setSort] = useState<SortKey>("score");
  const [asc, setAsc] = useState(false);

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

  const toggleSort = (k: SortKey) => {
    if (sort === k) setAsc((v) => !v);
    else {
      setSort(k);
      setAsc(false);
    }
  };

  const Th = ({ k, label, right = false }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-gelo ${sort === k ? "text-gelo" : ""}`}
      >
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
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
            <Th k="titulo" label="Lead" />
            <Th k="status" label="Etapa" />
            <th className="px-3 py-2 text-left font-medium">Prioridade</th>
            <Th k="responsavel" label="Responsável" />
            <Th k="valor" label="Valor" right />
            <Th k="score" label="Score" right />
            <Th k="interacao" label="Últ. interação" />
            <Th k="followup" label="Follow-up" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const stage = STAGE[l.status];
            const prio = PRIO[l.prioridade];
            return (
              <tr
                key={l.id}
                onClick={() => onOpen(l.id)}
                onContextMenu={(e) => onContext(e, l.id)}
                className="cursor-pointer border-b border-ink-line/50 last:border-0 hover:bg-ink-soft/50"
              >
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
