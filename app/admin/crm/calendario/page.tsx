import Link from "next/link";
import { isNotNull } from "drizzle-orm";
import { CalendarDays, KanbanSquare, ListTodo } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { tarefas, demandas } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";

export const dynamic = "force-dynamic";

type Evento = {
  id: string;
  titulo: string;
  prazo: Date;
  tipo: "tarefa" | "demanda";
  responsavel: string;
  href?: string;
  projetoId?: number;
};

function chaveDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rotuloDia(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  const hoje = chaveDia(new Date());
  const amanha = chaveDia(new Date(Date.now() + 86400000));
  const base = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
  if (iso === hoje) return `Hoje · ${base}`;
  if (iso === amanha) return `Amanhã · ${base}`;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export default async function CalendarioPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let eventos: Evento[] = [];
  let erro = false;
  try {
    const db = getDb();
    const [ts, ds] = await Promise.all([
      db.select().from(tarefas).where(isNotNull(tarefas.prazo)),
      db.select().from(demandas).where(isNotNull(demandas.prazo)),
    ]);
    eventos = [
      ...ts.map((t): Evento => ({
        id: `t${t.id}`,
        titulo: t.titulo,
        prazo: t.prazo as Date,
        tipo: "tarefa",
        responsavel: t.responsavel,
        projetoId: t.projetoId,
        href: `/admin/crm/projetos/${t.projetoId}`,
      })),
      ...ds.map((d): Evento => ({
        id: `d${d.id}`,
        titulo: d.titulo,
        prazo: d.prazo as Date,
        tipo: "demanda",
        responsavel: d.responsavel,
        href: "/admin/crm/demandas",
      })),
    ].sort((a, b) => a.prazo.getTime() - b.prazo.getTime());
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  // Só o que é de hoje pra frente.
  const hojeIso = chaveDia(new Date());
  const futuros = eventos.filter((e) => chaveDia(e.prazo) >= hojeIso);

  const porDia = new Map<string, Evento[]>();
  for (const e of futuros) {
    const k = chaveDia(e.prazo);
    porDia.set(k, [...(porDia.get(k) ?? []), e]);
  }
  const dias = [...porDia.keys()].sort();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Calendário</h1>
        <p className="mt-1 text-sm text-gelo-dim">
          Tarefas e demandas com prazo, de hoje em diante.
        </p>
      </div>

      {dias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-14 text-center">
          <CalendarDays className="h-8 w-8 text-gelo-dim" />
          <p className="text-sm text-gelo-dim">
            Nada agendado. Define um prazo ao criar uma tarefa ou demanda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {dias.map((dia) => (
            <div key={dia}>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">
                {rotuloDia(dia)}
              </h2>
              <ul className="flex flex-col gap-2">
                {porDia.get(dia)!.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={e.href ?? "#"}
                      className="flex items-center gap-3 rounded-xl border border-ink-line bg-ink-soft/30 p-4 transition-colors hover:border-roxo-light/40"
                    >
                      {e.tipo === "tarefa" ? (
                        <KanbanSquare className="h-4 w-4 shrink-0 text-roxo-light" />
                      ) : (
                        <ListTodo className="h-4 w-4 shrink-0 text-sky-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-gelo">
                        {e.titulo}
                      </span>
                      {e.responsavel && (
                        <span className="text-xs text-gelo-dim">{e.responsavel}</span>
                      )}
                      <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] uppercase tracking-wide text-gelo-dim">
                        {e.tipo}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
