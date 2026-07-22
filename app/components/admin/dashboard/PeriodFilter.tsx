"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Calendar } from "lucide-react";
import type { PeriodoKey } from "@/app/lib/crm/period";

const OPCOES: { key: PeriodoKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "ano", label: "Ano" },
  { key: "custom", label: "Personalizado" },
];

export function PeriodFilter({
  atual,
  de,
  ate,
}: {
  atual: PeriodoKey;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customOpen, setCustomOpen] = useState(atual === "custom");
  const [deVal, setDeVal] = useState(de);
  const [ateVal, setAteVal] = useState(ate);

  function setPeriodo(key: PeriodoKey) {
    if (key === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", key);
    params.delete("de");
    params.delete("ate");
    router.push(`?${params.toString()}`);
  }

  function applyCustom() {
    if (!deVal || !ateVal) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", "custom");
    params.set("de", deVal);
    params.set("ate", ateVal);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-ink-line bg-ink-soft/40 p-1">
        {OPCOES.map((o) => {
          const active = o.key === "custom" ? customOpen || atual === "custom" : atual === o.key && !customOpen;
          return (
            <button
              key={o.key}
              onClick={() => setPeriodo(o.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? "bg-roxo text-white" : "text-gelo-dim hover:text-gelo"
              }`}
            >
              {o.key === "custom" ? (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {o.label}
                </span>
              ) : (
                o.label
              )}
            </button>
          );
        })}
      </div>

      {customOpen && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={deVal}
            onChange={(e) => setDeVal(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink p-1.5 text-xs outline-none focus:border-roxo-light/60"
          />
          <span className="text-xs text-gelo-dim">até</span>
          <input
            type="date"
            value={ateVal}
            onChange={(e) => setAteVal(e.target.value)}
            className="rounded-lg border border-ink-line bg-ink p-1.5 text-xs outline-none focus:border-roxo-light/60"
          />
          <button
            onClick={applyCustom}
            className="rounded-lg bg-roxo px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
