"use client";

import { useState, type ReactNode } from "react";

type Tab = { key: string; label: string; content: ReactNode };

export function ClienteTabs({ tabs }: { tabs: Tab[] }) {
  const [ativa, setAtiva] = useState(tabs[0]?.key ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto border-b border-ink-line">
        {tabs.map((t) => {
          const on = t.key === ativa;
          return (
            <button
              key={t.key}
              onClick={() => setAtiva(t.key)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${
                on
                  ? "border-roxo-light font-medium text-gelo"
                  : "border-transparent text-gelo-dim hover:text-gelo"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.key} className={t.key === ativa ? "block" : "hidden"}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
