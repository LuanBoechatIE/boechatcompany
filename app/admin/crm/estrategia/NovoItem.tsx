"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { ESTRATEGIA_FASES, RESPONSAVEIS } from "@/app/lib/crm/types";
import { createEstrategiaItem } from "../../crm-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-sm outline-none focus:border-roxo-light/60";

export function NovoItem({ faseInicial }: { faseInicial?: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Novo item
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await createEstrategiaItem(fd);
        setAberto(false);
      }}
      className="w-full rounded-2xl border border-ink-line bg-ink-soft/40 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gelo">Novo item de estratégia</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-md p-1 text-gelo-dim hover:text-gelo"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <input name="titulo" required placeholder="O que precisa ser feito" className={inputCls} />
        <textarea name="descricao" rows={2} placeholder="Detalhe (opcional)" className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-3">
          <select name="fase" defaultValue={faseInicial ?? "fundacao"} className={inputCls}>
            {ESTRATEGIA_FASES.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <select name="responsavel" defaultValue="" className={inputCls}>
            <option value="">Responsável</option>
            {RESPONSAVEIS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select name="prioridade" defaultValue="media" className={inputCls}>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <button className="self-start rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">
          Adicionar
        </button>
      </div>
    </form>
  );
}
