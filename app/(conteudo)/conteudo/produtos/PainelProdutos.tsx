"use client";

import { useState, useTransition } from "react";
import {
  semearProdutos,
  sincronizar,
  recompilarBrief,
  lerBrief,
  type Estado,
  type ProdutoNaTela,
} from "../actions";

function dataCurta(d: Date | null): string {
  if (!d) return "nunca";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Selo = { texto: string; classe: string };

function seloDoProduto(p: ProdutoNaTela): Selo {
  if (p.fontes === 0)
    return { texto: "sem fontes", classe: "bg-red-500/15 text-red-300" };
  if (!p.temBrief)
    return { texto: "sem brief", classe: "bg-amber-500/15 text-amber-300" };
  if (p.desatualizado)
    return { texto: "desatualizado", classe: "bg-amber-500/15 text-amber-300" };
  return { texto: "pronto", classe: "bg-emerald-500/15 text-emerald-300" };
}

export function PainelProdutos({
  produtos,
  docsNoVault,
  vaultOk,
  iaOk,
}: {
  produtos: ProdutoNaTela[];
  docsNoVault: number;
  vaultOk: boolean;
  iaOk: boolean;
}) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [pendente, comecar] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [brief, setBrief] = useState<{ nome: string; md: string } | null>(null);

  function rodar(rotulo: string, fn: () => Promise<Estado>) {
    setOcupado(rotulo);
    setEstado(null);
    comecar(async () => {
      setEstado(await fn());
      setOcupado(null);
    });
  }

  async function verBrief(p: ProdutoNaTela) {
    const md = await lerBrief(p.id);
    setBrief({ nome: p.nome, md });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Produtos</h1>
          <p className="mt-2 max-w-2xl text-gelo-dim">
            Cada produto é um recorte do vault. O brief compilado é o contexto
            que a IA usa pra escrever, sem reler os documentos originais toda
            vez.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pendente}
            onClick={() => rodar("semear", semearProdutos)}
            className="rounded-xl border border-ink-line px-4 py-2.5 text-sm font-medium text-gelo transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {ocupado === "semear" ? "Criando…" : "Criar produtos padrão"}
          </button>
          <button
            type="button"
            disabled={pendente || !vaultOk}
            title={vaultOk ? undefined : "Defina GITHUB_TOKEN na Vercel"}
            onClick={() => rodar("sync", sincronizar)}
            className="rounded-xl bg-roxo px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-roxo-light hover:text-ink disabled:opacity-50"
          >
            {ocupado === "sync" ? "Sincronizando…" : "Sincronizar vault"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gelo-dim">
        {docsNoVault} documento(s) no espelho do vault.
      </p>

      {estado && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            estado.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {estado.msg}
        </div>
      )}

      {produtos.length === 0 ? (
        <p className="rounded-2xl border border-ink-line/70 bg-ink-soft/30 p-6 text-gelo-dim">
          Nenhum produto ainda. Clique em &ldquo;Criar produtos padrão&rdquo;
          pra começar com o mapa da casa.
        </p>
      ) : (
        <ul className="space-y-3">
          {produtos.map((p) => {
            const selo = seloDoProduto(p);
            const chave = `brief-${p.id}`;
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-ink-line/70 bg-ink-soft/30 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="font-medium text-gelo">{p.nome}</h2>
                      {p.ehMarca && (
                        <span className="rounded-md bg-roxo/20 px-2 py-0.5 text-xs text-roxo-light">
                          camada base
                        </span>
                      )}
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs ${selo.classe}`}
                      >
                        {selo.texto}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-2xl text-sm text-gelo-dim">
                      {p.descricao}
                    </p>
                    <p className="mt-3 text-xs text-gelo-dim/80">
                      {p.fontes} arquivo(s) de origem
                      {p.temBrief && (
                        <>
                          {" · "}~{p.briefTokens.toLocaleString("pt-BR")} tokens
                          {" · "}compilado em {dataCurta(p.briefGeradoEm)}
                        </>
                      )}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-gelo-dim/50">
                      {p.vaultGlobs.join("  ·  ")}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {p.temBrief && (
                      <button
                        type="button"
                        onClick={() => verBrief(p)}
                        className="rounded-lg border border-ink-line px-3 py-2 text-sm text-gelo-dim transition-colors hover:bg-ink-soft hover:text-gelo"
                      >
                        Ver brief
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={pendente || !iaOk || p.fontes === 0}
                      title={iaOk ? undefined : "Defina ANTHROPIC_API_KEY"}
                      onClick={() =>
                        rodar(chave, () => recompilarBrief(p.id, p.temBrief))
                      }
                      className="rounded-lg border border-ink-line px-3 py-2 text-sm font-medium text-gelo transition-colors hover:bg-ink-soft disabled:opacity-40"
                    >
                      {ocupado === chave
                        ? "Compilando…"
                        : p.temBrief
                          ? "Recompilar"
                          : "Compilar brief"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {brief && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setBrief(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-ink-line bg-ink p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-medium text-gelo">Brief · {brief.nome}</h3>
              <button
                type="button"
                onClick={() => setBrief(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-gelo-dim hover:bg-ink-soft hover:text-gelo"
              >
                Fechar
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gelo-dim">
              {brief.md}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
