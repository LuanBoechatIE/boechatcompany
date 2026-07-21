import Link from "next/link";
import { desc } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import { SetupNotice } from "../SetupNotice";
import { deletePreset } from "../actions";

export const dynamic = "force-dynamic";

export default async function PresetsPage() {
  if (!dbConfigured()) return <SetupNotice />;

  let lista: { id: number; nome: string; descricao: string; qtd: number }[] = [];
  let erro = false;
  try {
    const rows = await getDb().select().from(presets).orderBy(desc(presets.criadoEm));
    lista = rows.map((p) => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      qtd: Array.isArray(p.campos) ? p.campos.length : 0,
    }));
  } catch {
    erro = true;
  }
  if (erro) return <SetupNotice tabelas />;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Presets de oferta</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Modelos de onboarding. Cada oferta tem os campos que fazem sentido pra ela.
          </p>
        </div>
        <Link
          href="/onboarding/admin/presets/novo"
          className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white"
        >
          + Novo preset
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhum preset ainda. Crie o primeiro (ex.: <strong>Abertura Completa</strong>,{" "}
          <strong>Site Simples</strong>) pra poder cadastrar clientes.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <div className="min-w-0">
                <div className="font-medium">{p.nome}</div>
                <div className="mt-1 text-xs text-gelo-dim">
                  {p.qtd} {p.qtd === 1 ? "campo" : "campos"}
                  {p.descricao ? ` · ${p.descricao}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/onboarding/admin/presets/${p.id}`}
                  className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                >
                  Editar
                </Link>
                <form action={deletePreset}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:text-red-300">
                    Excluir
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
