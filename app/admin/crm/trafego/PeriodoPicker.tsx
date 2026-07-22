"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronsUpDown } from "lucide-react";
import {
  PERIODO_PRESETS,
  rangeFromPreset,
  isRangeValido,
  formatarRangeLabel,
  type PresetKey,
  type Range,
} from "@/app/lib/trafego/periodo";

export function PeriodoPicker({
  preset,
  range,
  onChange,
}: {
  preset: PresetKey;
  range: Range;
  onChange: (preset: PresetKey, range: Range) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const [erro, setErro] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolherPreset(p: PresetKey) {
    if (p === "custom") return; // custom aplica pelo botão
    onChange(p, rangeFromPreset(p));
    setAberto(false);
  }

  function aplicarCustom() {
    if (!isRangeValido(customFrom, customTo)) {
      setErro("A data inicial deve ser anterior ou igual à data final.");
      return;
    }
    setErro(null);
    onChange("custom", { from: customFrom, to: customTo });
    setAberto(false);
  }

  const labelPreset =
    PERIODO_PRESETS.find((p) => p.key === preset)?.label ?? "Período";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink-soft/40 px-4 py-2.5 text-sm transition-colors hover:border-roxo-light/40"
      >
        <CalendarDays className="h-4 w-4 text-gelo-dim" />
        <span className="text-gelo">{labelPreset}</span>
        <span className="hidden text-xs text-gelo-dim sm:inline">
          {formatarRangeLabel(range.from, range.to)}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-gelo-dim" />
      </button>

      {aberto && (
        <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-xl border border-ink-line bg-ink-soft p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <ul className="flex flex-col">
            {PERIODO_PRESETS.filter((p) => p.key !== "custom").map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => escolherPreset(p.key)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-roxo/10 ${
                    preset === p.key ? "text-roxo-light" : "text-gelo"
                  }`}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 border-t border-ink-line pt-2">
            <p className="px-3 pb-1 text-[11px] uppercase tracking-wide text-gelo-dim">
              Período personalizado
            </p>
            <div className="flex flex-col gap-2 px-1">
              <label className="flex items-center justify-between gap-2 text-xs text-gelo-dim">
                Início
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="rounded-lg border border-ink-line bg-ink px-2 py-1 text-sm text-gelo outline-none focus:border-roxo-light/60"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs text-gelo-dim">
                Fim
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="rounded-lg border border-ink-line bg-ink px-2 py-1 text-sm text-gelo outline-none focus:border-roxo-light/60"
                />
              </label>
              {erro && <p className="px-1 text-[11px] text-red-300">{erro}</p>}
              <button
                type="button"
                onClick={aplicarCustom}
                className="mt-1 rounded-lg bg-roxo px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
