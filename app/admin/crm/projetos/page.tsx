import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, KanbanSquare, ArrowRight } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { projetos, crmClientes, tarefas } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import {
  PROJETO_STATUS_LABEL,
  type ProjetoStatus,
} from "@/app/lib/crm/types";

export const dynamic = "force-dynamic";

const statusCls: Record<ProjetoStatus, string> = {
  planejamento: "bg-stone-500/10 text-stone-200/90 border-stone-500/30",
  andamento: "bg-yellow-500/10 text-yellow-200/90 border-yellow-500/30",
  revisao: "bg-violet-500/10 text-violet-200/90 border-violet-500/30",
  concluido: "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/30",
};

export default async function ProjetosPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let lista: {
    id: number;
    nome: string;
    status: string;
    clienteNome: string | null;
    tarefasAbertas: number;
  }[] = [];
  let erro = false;

  try {
    const db = getDb();
    const [ps, cs, ts] = await Promise.all([
      db.select().from(projetos).orderBy(desc(projetos.criadoEm)),
      db.select().from(crmClientes),
      db.select().from(tarefas),
    ]);
    const clienteNome = new Map(cs.map((c) => [c.id, c.nome]));
    lista = ps.map((p) => ({
      id: p.id,
      nome: p.nome,
      status: p.status,
      clienteNome: p.clienteId ? clienteNome.get(p.clienteId) ?? null : null,
      tarefasAbertas: ts.filter(
        (t) => t.projetoId === p.id && t.status !== "done",
      ).length,
    }));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Projetos</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Cada projeto tem seu próprio Kanban de tarefas.
          </p>
        </div>
        <Link
          href="/admin/crm/projetos/novo"
          className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo projeto
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center text-sm text-gelo-dim">
          Nenhum projeto ainda.{" "}
          <Link href="/admin/crm/projetos/novo" className="text-roxo-light underline">
            Cria o primeiro
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/crm/projetos/${p.id}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <KanbanSquare className="h-5 w-5 text-roxo-light" />
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${
                      statusCls[p.status as ProjetoStatus] ?? statusCls.planejamento
                    }`}
                  >
                    {PROJETO_STATUS_LABEL[p.status as ProjetoStatus] ?? p.status}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gelo">{p.nome}</div>
                  {p.clienteNome && (
                    <div className="mt-0.5 text-xs text-gelo-dim">{p.clienteNome}</div>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-1 text-xs text-gelo-dim">
                  {p.tarefasAbertas} tarefa{p.tarefasAbertas === 1 ? "" : "s"} em aberto
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
