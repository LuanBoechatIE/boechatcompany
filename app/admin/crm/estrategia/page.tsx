import { asc } from "drizzle-orm";
import { Check, Circle, CircleDot, Trash2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { estrategiaItems } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { temPermissao } from "@/app/lib/perms-guard";
import { NovoItem } from "./NovoItem";
import {
  ESTRATEGIA_FASES,
  PRIORIDADE_CLS,
  type Prioridade,
} from "@/app/lib/crm/types";
import { updateEstrategiaStatus, deleteEstrategiaItem } from "../../crm-actions";

export const dynamic = "force-dynamic";

// Próximo status no ciclo todo -> doing -> done -> todo.
const PROXIMO: Record<string, string> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "done") return <Check className="h-4 w-4 text-emerald-400" />;
  if (status === "doing") return <CircleDot className="h-4 w-4 text-yellow-400" />;
  return <Circle className="h-4 w-4 text-gelo-dim" />;
}

export default async function EstrategiaPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;
  if (!(await temPermissao("estrategia.visualizar"))) return <SemPermissao area="Estratégia" />;

  let itens: (typeof estrategiaItems.$inferSelect)[] = [];
  let erro = false;
  try {
    itens = await getDb()
      .select()
      .from(estrategiaItems)
      .orderBy(asc(estrategiaItems.ordem));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Estratégia</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Plano por fases. Clica no status pra avançar (a fazer, fazendo, feito).
          </p>
        </div>
        <NovoItem />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {ESTRATEGIA_FASES.map((fase) => {
          const doFase = itens.filter((i) => i.fase === fase.key);
          const feitos = doFase.filter((i) => i.status === "done").length;
          return (
            <div
              key={fase.key}
              className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-gelo">
                  {fase.label}
                </h2>
                <span className="text-xs text-gelo-dim/60">
                  {feitos}/{doFase.length}
                </span>
              </div>

              {doFase.length === 0 ? (
                <p className="py-4 text-center text-xs text-gelo-dim/60">
                  Sem itens nesta fase.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {doFase.map((i) => {
                    const prioridade = i.prioridade as Prioridade;
                    return (
                      <li
                        key={i.id}
                        className="rounded-xl border border-ink-line bg-ink p-3"
                      >
                        <div className="flex items-start gap-2">
                          <form action={updateEstrategiaStatus}>
                            <input type="hidden" name="id" value={i.id} />
                            <input type="hidden" name="status" value={PROXIMO[i.status] ?? "todo"} />
                            <button
                              className="mt-0.5 rounded-md p-0.5 hover:bg-ink-soft"
                              aria-label="Avançar status"
                            >
                              <StatusIcon status={i.status} />
                            </button>
                          </form>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                i.status === "done"
                                  ? "text-gelo-dim line-through"
                                  : "text-gelo"
                              }`}
                            >
                              {i.titulo}
                            </p>
                            {i.descricao && (
                              <p className="mt-0.5 text-xs text-gelo-dim">{i.descricao}</p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                                  PRIORIDADE_CLS[prioridade] ?? PRIORIDADE_CLS.media
                                }`}
                              >
                                {prioridade}
                              </span>
                              {i.responsavel && (
                                <span className="text-[10px] text-gelo-dim">{i.responsavel}</span>
                              )}
                            </div>
                          </div>
                          <form action={deleteEstrategiaItem}>
                            <input type="hidden" name="id" value={i.id} />
                            <button
                              className="rounded-md p-1 text-red-300/60 hover:text-red-300"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
