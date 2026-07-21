import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { eq } from "drizzle-orm";
import { getDb } from "@/app/lib/db";
import { clientes, presets, respostas } from "@/app/lib/db/schema";
import {
  STATUS_LABEL,
  type ClienteStatus,
  type FieldDef,
  type RespostaValores,
} from "@/app/lib/onboarding/types";
import { CopyLink } from "../../CopyLink";
import { reopenClient, deleteClient } from "../../actions";

export const dynamic = "force-dynamic";

function fmt(v: string | undefined): string {
  if (!v || !v.trim()) return "—";
  if (v === "sim") return "Sim";
  if (v === "nao") return "Não";
  return v;
}

function ehImagem(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)($|\?)/i.test(url);
}

function nomeDoArquivo(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

export default async function ClienteDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = Number(id);
  if (!clienteId) notFound();

  const db = getDb();
  const cRows = await db.select().from(clientes).where(eq(clientes.id, clienteId)).limit(1);
  const cliente = cRows[0];
  if (!cliente) notFound();

  const [pRows, rRows] = await Promise.all([
    db.select().from(presets).where(eq(presets.id, cliente.presetId)).limit(1),
    db.select().from(respostas).where(eq(respostas.clienteId, clienteId)).limit(1),
  ]);
  const campos = (pRows[0]?.campos as FieldDef[]) ?? [];
  const valores = (rRows[0]?.valores as RespostaValores) ?? {};
  const status = cliente.status as ClienteStatus;
  const temResposta = rRows.length > 0;

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin"
        className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Onboardings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">{cliente.nome}</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            {pRows[0]?.nome ?? "(preset removido)"}
            {cliente.contato ? ` · ${cliente.contato}` : ""}
          </p>
        </div>
        <span className="rounded-full border border-ink-line bg-ink px-3 py-1 text-xs text-gelo-dim">
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Link pro cliente */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-4">
        <span className="text-sm text-gelo-dim">Link de onboarding do cliente:</span>
        <code className="rounded bg-ink px-2 py-1 text-xs text-roxo-light">
          /onboarding/{cliente.token}
        </code>
        <CopyLink token={cliente.token} compact />
      </div>

      {/* Respostas */}
      <h2 className="mt-10 mb-4 text-sm font-medium text-gelo">Respostas</h2>
      {!temResposta ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          O cliente ainda não respondeu. Manda o link acima pra ele.
        </div>
      ) : (
        <dl className="flex flex-col gap-4">
          {campos.map((campo) => (
            <div
              key={campo.id}
              className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <dt className="text-xs uppercase tracking-wide text-gelo-dim">
                {campo.label}
              </dt>
              <dd className="mt-2 whitespace-pre-wrap break-words text-gelo">
                {(campo.tipo === "arquivo" || campo.tipo === "link") &&
                valores[campo.id]?.trim() ? (
                  <ul className="flex flex-col gap-2">
                    {valores[campo.id]
                      .split("\n")
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .map((u) => (
                        <li key={u} className="flex items-center gap-3">
                          {ehImagem(u) && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg border border-ink-line object-cover"
                            />
                          )}
                          <a
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-sm text-roxo-light underline"
                          >
                            {nomeDoArquivo(u)}
                          </a>
                        </li>
                      ))}
                  </ul>
                ) : (
                  fmt(valores[campo.id])
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Ações do admin */}
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-ink-line pt-6">
        {status === "respondido" && (
          <form action={reopenClient}>
            <input type="hidden" name="id" value={cliente.id} />
            <button className="rounded-full border border-roxo/50 bg-roxo/10 px-5 py-2.5 text-sm font-medium text-roxo-light hover:bg-roxo/20">
              Reabrir pra edição
            </button>
          </form>
        )}
        {status === "reaberto" && (
          <p className="text-sm text-roxo-light">
            Aberto pra edição. O cliente pode responder de novo pelo mesmo link.
          </p>
        )}
        <form action={deleteClient} className="ml-auto">
          <input type="hidden" name="id" value={cliente.id} />
          <button className="flex items-center gap-1.5 text-sm text-red-300/70 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5" />
            Excluir cliente
          </button>
        </form>
      </div>
    </div>
  );
}
