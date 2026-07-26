import Link from "next/link";
import { dbConfigured } from "@/app/lib/db";
import { iaConfigurada } from "@/app/lib/conteudo/ia/claude";
import { vaultConfigurado } from "@/app/lib/conteudo/vault/sync";
import { contarDocsDoVault, listarProdutos } from "./actions";

export const dynamic = "force-dynamic";

// A tela "Hoje" vai virar o motor de pautas na etapa 2. Por enquanto ela é o
// painel de prontidão: mostra o que ainda falta pra IA ter contexto bom.
export default async function ConteudoHome() {
  const banco = dbConfigured();
  let docs = 0;
  let produtos: Awaited<ReturnType<typeof listarProdutos>> = [];
  if (banco) {
    docs = await contarDocsDoVault();
    produtos = await listarProdutos();
  }
  const comBrief = produtos.filter((p) => p.temBrief).length;

  const checks = [
    {
      pronto: banco,
      titulo: "Banco conectado",
      detalhe: banco
        ? "Neon respondendo."
        : "Defina DATABASE_URL na Vercel.",
    },
    {
      pronto: vaultConfigurado(),
      titulo: "Acesso ao vault",
      detalhe: vaultConfigurado()
        ? "GITHUB_TOKEN configurado."
        : "Defina GITHUB_TOKEN com leitura no repo boechat-vault.",
    },
    {
      pronto: iaConfigurada(),
      titulo: "IA conectada",
      detalhe: iaConfigurada()
        ? "ANTHROPIC_API_KEY configurada."
        : "Defina ANTHROPIC_API_KEY na Vercel.",
    },
    {
      pronto: docs > 0,
      titulo: "Vault espelhado",
      detalhe:
        docs > 0
          ? `${docs} documentos no espelho.`
          : "Rode a sincronização em Produtos.",
    },
    {
      pronto: comBrief > 0,
      titulo: "Briefs compilados",
      detalhe:
        comBrief > 0
          ? `${comBrief} de ${produtos.length} produtos com brief.`
          : "Compile pelo menos o brief da Marca.",
    },
  ];

  const faltando = checks.filter((c) => !c.pronto).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Máquina de conteúdo
        </h1>
        <p className="mt-2 max-w-2xl text-gelo-dim">
          A IA lê a estratégia da casa e sugere o que postar. Você revisa, ajusta
          e aprova.
        </p>
      </div>

      <section className="rounded-2xl border border-ink-line/70 bg-ink-soft/40 p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-gelo-dim">
            Prontidão
          </h2>
          <span className="text-sm text-gelo-dim">
            {faltando === 0
              ? "Tudo pronto"
              : `${faltando} item(ns) pendente(s)`}
          </span>
        </div>
        <ul className="mt-5 space-y-3">
          {checks.map((c) => (
            <li key={c.titulo} className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  c.pronto ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <div>
                <p className="text-sm font-medium text-gelo">{c.titulo}</p>
                <p className="text-sm text-gelo-dim">{c.detalhe}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-ink-line/70 bg-ink-soft/20 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wider text-gelo-dim">
          Próxima etapa
        </h2>
        <p className="mt-3 max-w-2xl text-gelo-dim">
          O motor de pautas entra aqui: ao abrir, a IA sugere três ângulos com
          gancho pronto, você escolhe um e ela escreve o roteiro completo. Antes
          disso, o contexto precisa estar carregado.
        </p>
        <Link
          href="/conteudo/produtos"
          className="mt-5 inline-flex items-center rounded-xl bg-roxo px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-roxo-light hover:text-ink"
        >
          Preparar o contexto
        </Link>
      </section>
    </div>
  );
}
