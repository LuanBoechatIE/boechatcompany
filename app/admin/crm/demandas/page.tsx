import { asc } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { demandas } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { DemandasBoard } from "./DemandasBoard";
import { NovaDemanda } from "./NovaDemanda";
import type { KanbanItem } from "@/app/components/admin/kanban/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function DemandasPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let itens: KanbanItem[] = [];
  let erro = false;
  try {
    const rows = await getDb()
      .select()
      .from(demandas)
      .orderBy(asc(demandas.ordem));
    itens = rows.map((d) => ({
      id: d.id,
      titulo: d.titulo,
      descricao: d.descricao,
      responsavel: d.responsavel,
      prioridade: d.prioridade,
      status: d.status,
    }));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Demandas</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Kanban geral da agência. Arrasta os cards entre as colunas.
          </p>
        </div>
        <NovaDemanda />
      </div>

      <DemandasBoard items={itens} />
    </div>
  );
}
