"use client";

import { useState } from "react";
import type { VendedorRanking } from "@/app/lib/crm/equipe-data";

type Criterio = "reunioes" | "ligacoes" | "conversao" | "followups" | "produtividade";

const CRITERIOS: { key: Criterio; label: string }[] = [
  { key: "reunioes", label: "Mais reuniões" },
  { key: "ligacoes", label: "Mais ligações" },
  { key: "conversao", label: "Maior conversão" },
  { key: "followups", label: "Mais follow-ups concluídos" },
  { key: "produtividade", label: "Maior produtividade" },
];

function valorDe(v: VendedorRanking, c: Criterio): number {
  const m = v.metrics;
  switch (c) {
    case "reunioes": return m.atividade.total.reunioes;
    case "ligacoes": return m.atividade.total.ligacoes;
    case "conversao": return m.leadsGanhos + m.leadsPerdidos > 0 ? (m.leadsGanhos / (m.leadsGanhos + m.leadsPerdidos)) * 100 : 0;
    case "followups": return m.atividade.total.followupsCriados;
    // Produtividade: soma ponderada de atividade (proxy simples e transparente).
    case "produtividade":
      return m.atividade.total.ligacoes + m.atividade.total.whatsapps * 0.5 + m.atividade.total.reunioes * 3;
  }
}

const MEDALHAS = ["🥇", "🥈", "🥉"];
const CORES = ["border-yellow-400/50 bg-yellow-400/5", "border-slate-300/40 bg-slate-300/5", "border-orange-400/40 bg-orange-400/5"];

export function Podio({ vendedores, onAbrir }: { vendedores: VendedorRanking[]; onAbrir: (id: number) => void }) {
  const [criterio, setCriterio] = useState<Criterio>("reunioes");
  const top3 = [...vendedores].sort((a, b) => valorDe(b, criterio) - valorDe(a, criterio)).slice(0, 3);

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/40 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gelo">Ranking da equipe</h3>
        <select
          value={criterio}
          onChange={(e) => setCriterio(e.target.value as Criterio)}
          className="rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-xs text-gelo-dim outline-none focus:border-roxo-light/50"
        >
          {CRITERIOS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {top3.length === 0 ? (
        <p className="py-6 text-center text-sm text-gelo-dim/50">Sem dados ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {top3.map((v, i) => (
            <button
              key={v.usuarioId}
              onClick={() => onAbrir(v.usuarioId)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-transform hover:-translate-y-0.5 ${CORES[i]}`}
            >
              <span className="text-3xl">{MEDALHAS[i]}</span>
              {v.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.foto} alt={v.nome} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-roxo/20 text-sm text-roxo-light">
                  {v.nome.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="font-display text-sm text-gelo">{v.nome}</span>
              <span className="font-display text-xl text-gelo">
                {Math.round(valorDe(v, criterio) * 10) / 10}
                {criterio === "conversao" && "%"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
