"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

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
          ? "flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
          : "flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
      }
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copiar link
        </>
      )}
    </button>
  );
}
