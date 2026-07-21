import Link from "next/link";
import { desc } from "drizzle-orm";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import { SetupNotice } from "../SetupNotice";
import { deletePreset, seedPresetsPadrao } from "../actions";

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
        <div className="flex items-center gap-3">
          <form action={seedPresetsPadrao}>
            <button className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-5 py-3 text-sm font-medium text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
              <Sparkles className="h-4 w-4" />
              Criar presets padrão
            </button>
          </form>
          <Link
            href="/onboarding/admin/presets/novo"
            className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Novo preset
          </Link>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhum preset ainda. Clica em{" "}
          <strong className="text-gelo">Criar presets padrão</strong> pra já
          cadastrar as ofertas da Boechat (Site, Abertura Completa, Tráfego,
          Sistema, Dark Kitchen), ou monta um do zero em{" "}
          <strong className="text-gelo">+ Novo preset</strong>.
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
                  className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Link>
                <form action={deletePreset}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:border-red-500/30 hover:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
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
