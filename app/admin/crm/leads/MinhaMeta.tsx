"use client";

import { useState, useTransition } from "react";
import { Target, Pencil, Check } from "lucide-react";
import type { LeadsMetrics, MetasDiarias } from "@/app/lib/crm/leads-data";
import { setMetas } from "../../crm-actions";

const CAMPOS: { key: keyof MetasDiarias; label: string; cor: string }[] = [
  { key: "ligacoes", label: "Ligações", cor: "#38bdf8" },
  { key: "atendidas", label: "Atendidas", cor: "#34d399" },
  { key: "decisores", label: "Decisores", cor: "#a78bfa" },
  { key: "reunioes", label: "Reuniões", cor: "#f472b6" },
  { key: "whatsapps", label: "WhatsApps", cor: "#22d3ee" },
  { key: "followups", label: "Follow-ups", cor: "#fbbf24" },
];

export function MinhaMeta({ metas, metrics }: { metas: MetasDiarias; metrics: LeadsMetrics }) {
  const [editando, setEditando] = useState(false);
  const [vals, setVals] = useState<MetasDiarias>(metas);
  const [pending, start] = useTransition();
  const a = metrics.atividade.hoje;

  const realizado: Record<keyof MetasDiarias, number> = {
    ligacoes: a.ligacoes,
    atendidas: a.atendidas,
    decisores: a.decisores,
    reunioes: a.reunioes,
    whatsapps: a.whatsapps,
    followups: a.followupsConcluidos,
  };

  const totalMeta = CAMPOS.reduce((s, c) => s + (metas[c.key] || 0), 0);
  const totalFeito = CAMPOS.reduce((s, c) => s + Math.min(realizado[c.key], metas[c.key] || 0), 0);
  const pctGeral = totalMeta > 0 ? Math.round((totalFeito / totalMeta) * 100) : 0;

  function salvar() {
    start(async () => {
      await setMetas(vals);
      setEditando(false);
    });
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-gradient-to-br from-roxo/10 to-transparent p-5">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-4 w-4 text-roxo-light" />
        <span className="text-sm font-medium text-gelo">Minha meta de hoje</span>
        <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-gelo-dim">{pctGeral}% concluído</span>
        <button
          onClick={() => { setVals(metas); setEditando((v) => !v); }}
          className="ml-auto flex items-center gap-1 text-[11px] text-gelo-dim hover:text-gelo"
        >
          <Pencil className="h-3 w-3" /> {editando ? "Cancelar" : "Editar metas"}
        </button>
      </div>

      {editando ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CAMPOS.map((c) => (
              <label key={c.key} className="flex flex-col gap-1">
                <span className="text-[11px] text-gelo-dim">{c.label}</span>
                <input
                  type="number"
                  min={0}
                  value={vals[c.key]}
                  onChange={(e) => setVals({ ...vals, [c.key]: Number(e.target.value) })}
                  className="rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-sm outline-none focus:border-roxo-light/50"
                />
              </label>
            ))}
          </div>
          <button onClick={salvar} disabled={pending} className="flex items-center gap-1.5 self-start rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
            <Check className="h-4 w-4" /> Salvar metas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {CAMPOS.map((c) => {
            const feito = realizado[c.key];
            const meta = metas[c.key] || 0;
            const pct = meta > 0 ? Math.min(100, Math.round((feito / meta) * 100)) : 0;
            const bateu = feito >= meta && meta > 0;
            return (
              <div key={c.key}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[12px] text-gelo-dim">{c.label}</span>
                  <span className={`text-[12px] ${bateu ? "text-emerald-300" : "text-gelo"}`}>
                    <span className="font-display">{feito}</span>
                    <span className="text-gelo-dim/60">/{meta}</span>
                  </span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-full bg-ink-line">
                  <span
                    className="block h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: bateu ? "#34d399" : c.cor }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
