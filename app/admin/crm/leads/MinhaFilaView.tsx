"use client";

import {
  AlertTriangle,
  CalendarClock,
  ListChecks,
  UserPlus,
  FileText,
  Clock,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import type { FilaData, FilaItem } from "@/app/lib/crm/leads-data";

function Grupo({
  titulo,
  icon: Icon,
  cor,
  itens,
  onOpen,
}: {
  titulo: string;
  icon: LucideIcon;
  cor: string;
  itens: FilaItem[];
  onOpen: (id: number) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink-line bg-ink-soft/30">
      <div className="flex items-center gap-2 border-b border-ink-line px-4 py-3">
        <Icon className="h-4 w-4" style={{ color: cor }} />
        <span className="text-sm font-medium text-gelo">{titulo}</span>
        <span className="ml-auto rounded-full bg-ink px-2 py-0.5 text-[11px] text-gelo-dim">
          {itens.length}
        </span>
      </div>
      {itens.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-gelo-dim/40">Tudo em dia por aqui.</p>
      ) : (
        <ul className="flex max-h-72 flex-col overflow-y-auto">
          {itens.map((it, i) => (
            <li key={`${it.leadId}-${i}`}>
              <button
                onClick={() => onOpen(it.leadId)}
                className="group flex w-full items-center gap-2 border-b border-ink-line/40 px-4 py-2.5 text-left last:border-0 hover:bg-ink-soft/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gelo">{it.titulo}</p>
                  <p className="truncate text-[11px] text-gelo-dim">{it.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gelo-dim/30 group-hover:text-roxo-light" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MinhaFilaView({
  fila,
  onOpen,
}: {
  fila: FilaData;
  onOpen: (id: number) => void;
}) {
  const total =
    fila.followupAtrasado.length +
    fila.followupHoje.length +
    fila.tarefasPendentes.length +
    fila.novosSemContato.length +
    fila.propostasParaEnviar.length +
    fila.semInteracao7d.length;

  const resumo = [
    { n: fila.followupAtrasado.length, txt: "follow-ups atrasados" },
    { n: fila.followupHoje.length, txt: "follow-ups hoje" },
    { n: fila.tarefasPendentes.length, txt: "tarefas pendentes" },
    { n: fila.novosSemContato.length, txt: "novos sem contato" },
    { n: fila.propostasParaEnviar.length, txt: "propostas em aberto" },
  ].filter((r) => r.n > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-ink-line bg-gradient-to-br from-roxo/10 to-transparent p-5">
        <p className="text-xs uppercase tracking-wide text-gelo-dim">Sua fila de hoje</p>
        <p className="mt-1 font-display text-2xl text-gelo">
          {total === 0 ? "Nada pendente. Bom trabalho." : `${total} ações esperando por você`}
        </p>
        {resumo.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {resumo.map((r) => (
              <span key={r.txt} className="rounded-full bg-ink px-3 py-1 text-[12px] text-gelo-dim">
                <span className="font-medium text-gelo">{r.n}</span> {r.txt}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Grupo titulo="Follow-ups atrasados" icon={AlertTriangle} cor="#f87171" itens={fila.followupAtrasado} onOpen={onOpen} />
        <Grupo titulo="Follow-ups de hoje" icon={CalendarClock} cor="#38bdf8" itens={fila.followupHoje} onOpen={onOpen} />
        <Grupo titulo="Tarefas pendentes" icon={ListChecks} cor="#a78bfa" itens={fila.tarefasPendentes} onOpen={onOpen} />
        <Grupo titulo="Novos sem contato" icon={UserPlus} cor="#34d399" itens={fila.novosSemContato} onOpen={onOpen} />
        <Grupo titulo="Propostas em aberto" icon={FileText} cor="#fbbf24" itens={fila.propostasParaEnviar} onOpen={onOpen} />
        <Grupo titulo="Sem interação +7 dias" icon={Clock} cor="#fbbf24" itens={fila.semInteracao7d} onOpen={onOpen} />
      </div>
    </div>
  );
}
