"use client";

import { useState } from "react";

export function CopyLink({ token, compact = false }: { token: string; compact?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const path = `/onboarding/${token}`;

  async function copiar() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // clipboard bloqueado; ignora
    }
  }

  return (
    <button
      onClick={copiar}
      title="Copiar o link pra mandar pro cliente"
      className={
        compact
          ? "rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
          : "rounded-xl border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
      }
    >
      {copiado ? "✓ Copiado" : "Copiar link"}
    </button>
  );
}
