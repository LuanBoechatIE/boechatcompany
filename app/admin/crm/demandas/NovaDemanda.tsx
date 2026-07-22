"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { RESPONSAVEIS } from "@/app/lib/crm/types";
import { createDemanda } from "../../crm-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-sm outline-none focus:border-roxo-light/60";

export function NovaDemanda() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Nova demanda
      </button>
    );
  }

  return (
    <form
      action={async (fd) => {
        await createDemanda(fd);
        setAberto(false);
      }}
      className="w-full rounded-2xl border border-ink-line bg-ink-soft/40 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gelo">Nova demanda</h2>
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
        <input name="titulo" required placeholder="Título da demanda" className={inputCls} />
        <textarea name="descricao" rows={2} placeholder="Descrição (opcional)" className={inputCls} />
        <div className="grid gap-3 sm:grid-cols-2">
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
            <option value="urgente">Urgente</option>
          </select>
        </div>
        <button className="self-start rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">
          Criar demanda
        </button>
      </div>
    </form>
  );
}
