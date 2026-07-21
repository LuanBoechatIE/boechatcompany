"use client";

import { useActionState } from "react";
import { submitOnboarding, type SubmitState } from "./actions";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

const initial: SubmitState = { status: "idle" };

function Campo({ campo, valor }: { campo: FieldDef; valor: string }) {
  const name = `campo_${campo.id}`;
  const req = campo.obrigatorio;

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gelo">
        {campo.label}
        {req && <span className="text-roxo-light"> *</span>}
      </span>
      {campo.ajuda && <span className="-mt-1 text-xs text-gelo-dim">{campo.ajuda}</span>}

      {campo.tipo === "textarea" ? (
        <textarea name={name} defaultValue={valor} rows={4} className={inputCls} />
      ) : campo.tipo === "select" ? (
        <select name={name} defaultValue={valor} className={inputCls}>
          <option value="">Selecione</option>
          {(campo.opcoes ?? []).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      ) : campo.tipo === "sim_nao" ? (
        <div className="flex gap-6 pt-1">
          {[
            ["sim", "Sim"],
            ["nao", "Não"],
          ].map(([v, label]) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gelo">
              <input
                type="radio"
                name={name}
                value={v}
                defaultChecked={valor === v}
                className="h-4 w-4 accent-[var(--color-roxo)]"
              />
              {label}
            </label>
          ))}
        </div>
      ) : (
        <input
          type={
            campo.tipo === "numero"
              ? "number"
              : campo.tipo === "data"
                ? "date"
                : campo.tipo === "link"
                  ? "url"
                  : "text"
          }
          name={name}
          defaultValue={valor}
          placeholder={campo.tipo === "link" ? "https://..." : undefined}
          className={inputCls}
        />
      )}
    </label>
  );
}

export function OnboardingForm({
  token,
  campos,
  valores,
}: {
  token: string;
  campos: FieldDef[];
  valores: RespostaValores;
}) {
  const [state, action, pending] = useActionState(submitOnboarding, initial);

  if (state.status === "ok") {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="font-display text-2xl uppercase text-gelo">Recebido!</div>
        <p className="mt-3 text-sm text-gelo-dim">
          Suas respostas foram enviadas. Já vamos começar a estruturar. Se
          faltar algo, a gente te chama. Pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="__token" value={token} />

      {campos.map((campo) => (
        <Campo key={campo.id} campo={campo} valor={valores[campo.id] ?? ""} />
      ))}

      {state.status === "erro" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
          {state.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-roxo px-8 py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
      >
        {pending ? "Enviando..." : "Enviar respostas"}
      </button>

      <p className="text-xs text-gelo-dim">
        Você envia uma vez. Se precisar corrigir algo depois, é só avisar a
        gente que reabrimos pra você.
      </p>
    </form>
  );
}
