"use client";

// Pop-up de motivo da perda. Abre sempre que um lead (ou um lote) vai pra
// "perdido", venha de onde vier: arrastar no quadro, menu de contexto ou barra
// de seleção. O motivo é obrigatório, e a lista padrão fica a um clique porque
// campo livre puro vira "sumiu", "não quis", "n deu" e o diagnóstico de funil
// morre ali.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CircleSlash, X } from "lucide-react";
import { MOTIVOS_PERDA } from "@/app/lib/crm/types";

export function ModalMotivoPerda({
  quantidade,
  nome,
  pendente = false,
  erro,
  onConfirmar,
  onCancelar,
}: {
  quantidade: number;
  /** Nome do lead, quando é um só. Dá contexto pra quem arrastou sem querer. */
  nome?: string;
  pendente?: boolean;
  erro?: string | null;
  onConfirmar: (motivo: string) => void;
  onCancelar: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancelar();
      }
    };
    // Captura: o workspace também escuta Escape (pra limpar seleção), e sem isso
    // um Escape fecharia o modal E limparia a seleção ao mesmo tempo.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onCancelar]);

  const valido = motivo.trim().length > 0;
  const confirmar = () => {
    if (!valido || pendente) return;
    onConfirmar(motivo.trim());
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancelar}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-2xl border border-ink-line bg-ink-soft p-5 shadow-2xl"
      >
        <button
          onClick={onCancelar}
          className="absolute right-3 top-3 text-gelo-dim/60 transition-colors hover:text-gelo"
          aria-label="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-red-300">
          <CircleSlash className="h-4 w-4" />
          <h2 className="text-[15px] font-medium text-gelo">
            {quantidade > 1
              ? `Marcar ${quantidade} leads como perdidos`
              : "Marcar como perdido"}
          </h2>
        </div>

        <p className="mt-1.5 text-[13px] text-gelo-dim">
          {quantidade > 1 ? (
            <>O mesmo motivo vale pros {quantidade} selecionados.</>
          ) : (
            <>{nome ? <b className="text-gelo">{nome}</b> : "Este lead"} sai do funil ativo.</>
          )}{" "}
          O motivo é obrigatório: é dele que sai o diagnóstico de onde o funil vaza.
        </p>

        <label
          htmlFor="motivo-perda"
          className="mt-4 block text-[11px] uppercase tracking-wide text-gelo-dim"
        >
          Motivo
        </label>
        <input
          id="motivo-perda"
          ref={inputRef}
          list="motivos-perda-modal"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmar();
          }}
          placeholder="Escolha ou escreva"
          className="mt-1.5 w-full rounded-lg border border-ink-line bg-ink px-3 py-2 text-sm text-gelo outline-none placeholder:text-gelo-dim/40 focus:border-roxo-light/50"
        />
        <datalist id="motivos-perda-modal">
          {MOTIVOS_PERDA.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {MOTIVOS_PERDA.map((m) => (
            <button
              key={m}
              onClick={() => setMotivo(m)}
              className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                motivo === m
                  ? "border-roxo bg-roxo/15 text-roxo-light"
                  : "border-ink-line text-gelo-dim hover:border-roxo-light/40 hover:text-gelo"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {erro && <p className="mt-3 text-[12px] text-red-300">{erro}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-lg border border-ink-line px-3 py-2 text-sm text-gelo-dim transition-colors hover:text-gelo"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={!valido || pendente}
            className="flex-1 rounded-lg bg-red-500/85 px-3 py-2 text-sm text-white transition-colors hover:bg-red-500 disabled:opacity-40"
          >
            {pendente ? "Marcando..." : "Marcar perdido"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
