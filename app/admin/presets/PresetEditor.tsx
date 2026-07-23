"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  TIPOS_LABEL,
  type FieldDef,
  type FieldType,
} from "@/app/lib/onboarding/types";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

function novoId(): string {
  const c = globalThis.crypto;
  return "f_" + (c?.randomUUID?.() ?? Math.random().toString(36).slice(2));
}

function campoVazio(): FieldDef {
  return { id: novoId(), label: "", tipo: "texto", obrigatorio: true };
}

export function PresetEditor({
  action,
  initial,
  rotuloNome = "Nome da oferta / preset",
  rotuloCampos = "Campos do onboarding",
  voltarHref = "/admin/presets",
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: { id: number; nome: string; descricao: string; campos: FieldDef[] };
  rotuloNome?: string;
  rotuloCampos?: string;
  voltarHref?: string;
}) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [campos, setCampos] = useState<FieldDef[]>(
    initial?.campos?.length ? initial.campos : [campoVazio()],
  );

  function update(id: string, patch: Partial<FieldDef>) {
    setCampos((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function remove(id: string) {
    setCampos((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  }
  function move(id: string, dir: -1 | 1) {
    setCampos((cs) => {
      const i = cs.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= cs.length) return cs;
      const copy = [...cs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  const camposLimpos = campos
    .filter((c) => c.label.trim())
    .map((c) => ({
      ...c,
      opcoes: c.tipo === "select" ? c.opcoes : undefined,
    }));

  return (
    <form action={action} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="campos" value={JSON.stringify(camposLimpos)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">{rotuloNome}</span>
          <input
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Abertura Completa"
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Descrição (opcional)</span>
          <input
            name="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Pra que serve esse onboarding"
            className={inputCls}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gelo">
            {rotuloCampos} ({camposLimpos.length})
          </h2>
        </div>

        {campos.map((campo, idx) => (
          <div
            key={campo.id}
            className="rounded-2xl border border-ink-line bg-ink-soft/30 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-3 select-none text-xs text-gelo-dim">
                #{idx + 1}
              </span>
              <div className="flex flex-1 flex-col gap-3">
                <input
                  value={campo.label}
                  onChange={(e) => update(campo.id, { label: e.target.value })}
                  placeholder="A pergunta que o cliente vê (ex.: Logo em alta)"
                  className={inputCls}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={campo.tipo}
                    onChange={(e) =>
                      update(campo.id, { tipo: e.target.value as FieldType })
                    }
                    className={inputCls}
                  >
                    {(Object.keys(TIPOS_LABEL) as FieldType[]).map((t) => (
                      <option key={t} value={t}>
                        {TIPOS_LABEL[t]}
                      </option>
                    ))}
                  </select>

                  <label className="flex items-center gap-2 text-sm text-gelo-dim">
                    <input
                      type="checkbox"
                      checked={campo.obrigatorio}
                      onChange={(e) =>
                        update(campo.id, { obrigatorio: e.target.checked })
                      }
                      className="h-4 w-4 accent-[var(--color-roxo)]"
                    />
                    Obrigatório
                  </label>
                </div>

                {campo.tipo === "select" && (
                  <textarea
                    value={(campo.opcoes ?? []).join("\n")}
                    onChange={(e) =>
                      update(campo.id, {
                        opcoes: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Uma opção por linha"
                    rows={3}
                    className={inputCls}
                  />
                )}

                <input
                  value={campo.ajuda ?? ""}
                  onChange={(e) => update(campo.id, { ajuda: e.target.value })}
                  placeholder="Texto de ajuda (opcional)"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(campo.id, -1)}
                  className="rounded-md border border-ink-line p-1.5 text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                  aria-label="Mover pra cima"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(campo.id, 1)}
                  className="rounded-md border border-ink-line p-1.5 text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                  aria-label="Mover pra baixo"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(campo.id)}
                  className="rounded-md border border-ink-line p-1.5 text-red-300/80 hover:border-red-500/30 hover:text-red-300"
                  aria-label="Remover campo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setCampos((cs) => [...cs, campoVazio()])}
          className="flex items-center gap-2 self-start rounded-xl border border-dashed border-ink-line px-4 py-2 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
        >
          <Plus className="h-4 w-4" />
          Adicionar campo
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!nome.trim() || camposLimpos.length === 0}
          className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          Salvar preset
        </button>
        <Link
          href={voltarHref}
          className="text-sm text-gelo-dim hover:text-gelo"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
