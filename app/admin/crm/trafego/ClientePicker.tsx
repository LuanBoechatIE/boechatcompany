"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Search, Check, Building2 } from "lucide-react";
import { formatarIdCliente } from "@/app/lib/trafego/periodo";
import type { ClienteTrafego } from "@/app/admin/trafego-actions";

// Debounce simples pra pesquisa.
function useDebounce<T>(valor: T, ms: number): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}

export function ClientePicker({
  clientes,
  selecionado,
  onSelect,
  carregando,
}: {
  clientes: ClienteTrafego[];
  selecionado: ClienteTrafego | null;
  onSelect: (c: ClienteTrafego) => void;
  carregando: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 200);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const filtrados = useMemo(() => {
    const q = buscaDebounced.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter((c) => {
      const id = formatarIdCliente(c.id);
      return (
        c.nome.toLowerCase().includes(q) ||
        c.empresa.toLowerCase().includes(q) ||
        String(c.id).includes(q) ||
        id.includes(q)
      );
    });
  }, [clientes, buscaDebounced]);

  const vazio = clientes.length === 0;

  return (
    <div ref={ref} className="relative w-full sm:w-80">
      <button
        type="button"
        onClick={() => !vazio && setAberto((a) => !a)}
        disabled={vazio}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft/40 px-4 py-2.5 text-left text-sm transition-colors hover:border-roxo-light/40 disabled:opacity-50"
      >
        {selecionado ? (
          <span className="min-w-0">
            <span className="block truncate font-medium text-gelo">{selecionado.nome}</span>
            <span className="block text-xs text-gelo-dim">ID: {formatarIdCliente(selecionado.id)}</span>
          </span>
        ) : (
          <span className="text-gelo-dim">
            {vazio ? "Nenhum cliente cadastrado" : "Selecionar cliente"}
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-gelo-dim" />
      </button>

      {aberto && !vazio && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-ink-line bg-ink-soft shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-2 border-b border-ink-line px-3 py-2">
            <Search className="h-4 w-4 text-gelo-dim" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por nome ou ID"
              className="w-full bg-transparent text-sm text-gelo outline-none placeholder:text-gelo-dim/60"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto overscroll-contain py-1">
            {filtrados.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gelo-dim">Nada encontrado.</li>
            ) : (
              filtrados.map((c) => {
                const on = selecionado?.id === c.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(c);
                        setAberto(false);
                        setBusca("");
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-roxo/10"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-gelo-dim" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gelo">{c.nome}</span>
                        <span className="block text-xs text-gelo-dim">
                          ID: {formatarIdCliente(c.id)}
                          {c.empresa ? ` · ${c.empresa}` : ""}
                        </span>
                      </span>
                      {on && <Check className="h-4 w-4 shrink-0 text-roxo-light" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {carregando && (
        <span className="pointer-events-none absolute -bottom-5 left-1 text-[11px] text-gelo-dim/70">
          Atualizando painel…
        </span>
      )}
    </div>
  );
}
