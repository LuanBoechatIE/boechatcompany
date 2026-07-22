import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getDb } from "@/app/lib/db";
import { projetos, crmClientes, tarefas } from "@/app/lib/db/schema";
import {
  PROJETO_STATUS_LABEL,
  type ProjetoStatus,
} from "@/app/lib/crm/types";
import { TarefasBoard } from "./TarefasBoard";
import { NovaTarefa } from "./NovaTarefa";
import { deleteProjeto } from "../../../crm-actions";
import type { KanbanItem } from "@/app/components/admin/kanban/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function ProjetoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projetoId = Number(id);
  if (!projetoId) notFound();

  const db = getDb();
  const pRows = await db
    .select()
    .from(projetos)
    .where(eq(projetos.id, projetoId))
    .limit(1);
  const projeto = pRows[0];
  if (!projeto) notFound();

  const [cRows, tRows] = await Promise.all([
    projeto.clienteId
      ? db.select().from(crmClientes).where(eq(crmClientes.id, projeto.clienteId)).limit(1)
      : Promise.resolve([]),
    db.select().from(tarefas).where(eq(tarefas.projetoId, projetoId)).orderBy(asc(tarefas.ordem)),
  ]);

  const itens: KanbanItem[] = tRows.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    responsavel: t.responsavel,
    prioridade: t.prioridade,
    status: t.status,
    prazo: t.prazo
      ? new Date(t.prazo).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : undefined,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/crm/projetos"
        className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Projetos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl uppercase">{projeto.nome}</h1>
            <span className="rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
              {PROJETO_STATUS_LABEL[projeto.status as ProjetoStatus] ?? projeto.status}
            </span>
          </div>
          {cRows[0] && (
            <p className="mt-1 text-sm text-gelo-dim">{cRows[0].nome}</p>
          )}
        </div>
        <form action={deleteProjeto}>
          <input type="hidden" name="id" value={projeto.id} />
          <button className="flex items-center gap-1.5 text-sm text-red-300/70 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5" />
            Excluir projeto
          </button>
        </form>
      </div>

      {projeto.briefing && (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5 text-sm leading-relaxed text-gelo-dim">
          {projeto.briefing}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-gelo">
          Tarefas
        </h2>
        <NovaTarefa projetoId={projeto.id} />
      </div>

      <TarefasBoard items={itens} projetoId={projeto.id} />
    </div>
  );
}
