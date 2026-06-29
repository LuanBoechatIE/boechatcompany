"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const res = await fetch("/contratos/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace("/contratos");
        router.refresh();
      } else if (res.status === 500) {
        setErro("Login não configurado no servidor. Defina as variáveis na Vercel.");
      } else {
        setErro("Usuário ou senha incorretos.");
      }
    } catch {
      setErro("Erro de conexão. Tenta de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-ink-line bg-ink-soft/40 p-8"
      >
        <div className="font-display text-xl uppercase">
          Boechat<span className="text-roxo">.</span>
        </div>
        <h1 className="mt-2 text-lg font-medium">Área interna</h1>
        <p className="mt-1 text-sm text-gelo-dim">Acesso restrito.</p>

        <label className="mt-6 flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Usuário</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60"
          />
        </label>

        <label className="mt-4 flex flex-col gap-2">
          <span className="text-sm text-gelo-dim">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60"
          />
        </label>

        {erro && <p className="mt-4 text-sm text-red-400">{erro}</p>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="mt-6 w-full rounded-full bg-roxo px-6 py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
