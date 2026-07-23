"use client";

import { useActionState } from "react";
import { submitOnboarding, type SubmitState } from "./actions";
import { Campo } from "@/app/components/forms/DynamicField";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

const initial: SubmitState = { status: "idle" };

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
        <Campo
          key={campo.id}
          campo={campo}
          valor={valores[campo.id] ?? ""}
          uploadUrl="/onboarding/api/upload"
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
        {pending ? "Enviando..." : "Enviar respostas"}
      </button>

      <p className="text-xs text-gelo-dim">
        Você envia uma vez. Se precisar corrigir algo depois, é só avisar a
        gente que reabrimos pra você.
      </p>
    </form>
  );
}
