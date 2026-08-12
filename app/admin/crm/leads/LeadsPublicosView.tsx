"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, ChevronRight, Inbox } from "lucide-react";
import type { LeadDTO } from "@/app/lib/crm/types";
import { reivindicarLeadPublico } from "../../crm-actions";

const TEMPERATURA_COR: Record<string, string> = {
  quente: "#f87171",
  morno: "#fbbf24",
  frio: "#38bdf8",
};

// Pool de leads sem dono: qualquer vendedor pode ver e ligar. "Pegar e ligar"
// reivindica na hora (reivindicarLeadPublico) e abre o atendimento — mas
// mesmo sem clicar nesse botão, a primeira interação registrada no
// atendimento (LeadAtendimento → registrarResultado) já reivindica sozinha,
// então abrir e ligar direto também funciona.
export function LeadsPublicosView({ leads, onOpen }: { leads: LeadDTO[]; onOpen: (id: number) => void }) {
  const router = useRouter();
  const [pendenteId, setPendenteId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function pegarELigar(id: number) {
    setErro(null);
    setPendenteId(id);
    start(async () => {
      const r = await reivindicarLeadPublico(id);
      if (!r.ok) {
        setErro(r.erro ?? "Não foi possível pegar esse lead.");
        router.refresh();
        return;
      }
      onOpen(id);
    });
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink-line bg-ink-soft/30 py-16 text-center">
        <Inbox className="h-8 w-8 text-gelo-dim/40" />
        <p className="text-sm text-gelo-dim">Nenhum lead público no momento.</p>
        <p className="text-[11px] text-gelo-dim/50">Leads sem dono aparecem aqui pra qualquer vendedor pegar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-ink-line bg-gradient-to-br from-roxo/10 to-transparent p-5">
        <p className="text-xs uppercase tracking-wide text-gelo-dim">Leads públicos</p>
        <p className="mt-1 font-display text-2xl text-gelo">{leads.length} esperando alguém ligar</p>
        <p className="mt-1 text-[12px] text-gelo-dim">Pegue um lead e ele já fica seu — não precisa avisar ninguém.</p>
      </div>

      {erro && <p className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-200/90">{erro}</p>}

      <ul className="flex flex-col divide-y divide-ink-line/60 rounded-2xl border border-ink-line bg-ink-soft/30">
        {leads.map((l) => (
          <li key={l.id} className="flex items-center gap-3 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TEMPERATURA_COR[l.temperatura] ?? "#666" }} />
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpen(l.id)}>
              <p className="truncate text-sm text-gelo">{l.empresa || l.nome}</p>
              <p className="truncate text-[11px] text-gelo-dim">{l.pessoaContato || l.nome}{l.telefone ? ` · ${l.telefone}` : ""}{l.servico ? ` · ${l.servico}` : ""}</p>
            </div>
            <button
              onClick={() => pegarELigar(l.id)}
              disabled={pending && pendenteId === l.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-roxo px-4 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              <Phone className="h-3.5 w-3.5" />
              {pending && pendenteId === l.id ? "Pegando..." : "Pegar e ligar"}
            </button>
            <ChevronRight className="h-4 w-4 shrink-0 cursor-pointer text-gelo-dim/30 hover:text-roxo-light" onClick={() => onOpen(l.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
