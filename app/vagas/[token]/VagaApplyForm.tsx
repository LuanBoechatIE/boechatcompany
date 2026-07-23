"use client";

import { useActionState } from "react";
import { submitCandidatura, type SubmitState } from "./actions";
import { Campo, inputCls } from "@/app/components/forms/DynamicField";
import type { FieldDef } from "@/app/lib/onboarding/types";

const initial: SubmitState = { status: "idle" };

export function VagaApplyForm({ token, campos }: { token: string; campos: FieldDef[] }) {
  const [state, action, pending] = useActionState(submitCandidatura, initial);

  if (state.status === "ok") {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="font-display text-2xl uppercase text-gelo">Candidatura enviada!</div>
        <p className="mt-3 text-sm text-gelo-dim">
          Recebemos sua candidatura. Se avançar, entramos em contato pelo
          telefone ou e-mail informado. Pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="__token" value={token} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gelo">
          Nome completo<span className="text-roxo-light"> *</span>
        </span>
        <input name="nome" required className={inputCls} />
      </label>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gelo">
            E-mail<span className="text-roxo-light"> *</span>
          </span>
          <input name="email" type="email" required className={inputCls} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gelo">
            Telefone / WhatsApp<span className="text-roxo-light"> *</span>
          </span>
          <input name="telefone" required className={inputCls} />
        </label>
      </div>

      {campos.map((campo) => (
        <Campo
          key={campo.id}
          campo={campo}
          valor=""
          uploadUrl="/vagas/api/upload"
          uploadToken={token}
        />
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
        {pending ? "Enviando..." : "Enviar candidatura"}
      </button>
    </form>
  );
}
