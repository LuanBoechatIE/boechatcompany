import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, Network, Trash2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { mapasMentais } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { createMapa, deleteMapa } from "../../crm-actions";

export const dynamic = "force-dynamic";

export default async function MapasPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let lista: { id: number; titulo: string; nos: number }[] = [];
  let erro = false;
  try {
    const rows = await getDb()
      .select()
      .from(mapasMentais)
      .orderBy(desc(mapasMentais.atualizadoEm));
    lista = rows.map((m) => ({
      id: m.id,
      titulo: m.titulo,
      nos: Array.isArray(m.nodes) ? m.nodes.length : 0,
    }));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Mapas mentais</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Canvas livre pra estruturar ideias, funis e briefings.
          </p>
        </div>
        <form action={createMapa}>
          <button className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo mapa
          </button>
        </form>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center text-sm text-gelo-dim">
          Nenhum mapa ainda. Cria o primeiro no botão acima.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <Link
                href={`/admin/crm/mapas/${m.id}`}
                className="group flex min-w-0 flex-1 items-center gap-3"
              >
                <Network className="h-5 w-5 shrink-0 text-roxo-light" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-gelo group-hover:text-roxo-light">
                    {m.titulo}
                  </div>
                  <div className="text-xs text-gelo-dim">
                    {m.nos} {m.nos === 1 ? "nó" : "nós"}
                  </div>
                </div>
              </Link>
              <form action={deleteMapa}>
                <input type="hidden" name="id" value={m.id} />
                <button
                  className="rounded-lg border border-ink-line bg-ink p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300"
                  aria-label="Excluir mapa"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
