"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { alterarMinhaSenha } from "../perfil-actions";

export function PrimeiroAcessoForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  async function onSubmit(formData: FormData) {
    setErro("");
    const r = await alterarMinhaSenha(formData);
    if (!r.ok) {
      setErro(r.erro ?? "Não deu pra trocar a senha.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      action={(fd) => startTransition(() => onSubmit(fd))}
      className="flex flex-col gap-5"
    >
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gelo">Senha temporária (a que você recebeu)</span>
        <input
          name="senhaAtual"
          type="password"
          required
          className="w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gelo">Nova senha</span>
        <input
          name="novaSenha"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gelo">Confirmar nova senha</span>
        <input
          name="confirmarSenha"
          type="password"
          required
          minLength={8}
          className="w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60"
        />
      </label>

      {erro && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">{erro}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-roxo px-8 py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
      >
        {pending ? "Trocando..." : "Trocar senha e entrar"}
      </button>
    </form>
  );
}
