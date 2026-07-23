"use client";

import { useEffect, useRef, useTransition } from "react";
import {
  PanelRight,
  ArrowRightLeft,
  UserRoundCheck,
  CircleSlash,
  Trash2,
} from "lucide-react";
import {
  LEAD_STAGES,
  LEAD_PRIORIDADES,
  type LeadDTO,
  type LeadStatus,
} from "@/app/lib/crm/types";
import {
  setLeadPrioridade,
  convertLeadToClient,
  markLeadLost,
  deleteLead,
} from "../../crm-actions";

export type MenuState = { lead: LeadDTO; x: number; y: number };

export function LeadContextMenu({
  state,
  onClose,
  onOpen,
  onMove,
}: {
  state: MenuState;
  onClose: () => void;
  onOpen: (id: number) => void;
  onMove: (id: number, status: LeadStatus) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, start] = useTransition();
  const { lead } = state;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Mantém o menu dentro da viewport.
  const x = Math.min(state.x, (typeof window !== "undefined" ? window.innerWidth : 9999) - 240);
  const y = Math.min(state.y, (typeof window !== "undefined" ? window.innerHeight : 9999) - 360);

  const run = (fn: () => void) => {
    start(fn);
    onClose();
  };

  const acaoForm = (action: (fd: FormData) => Promise<void> | void) => {
    const fd = new FormData();
    fd.set("id", String(lead.id));
    run(() => void action(fd));
  };

  const item =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-gelo-dim hover:bg-ink hover:text-gelo disabled:opacity-40";

  return (
    <div
      ref={ref}
      style={{ top: y, left: x }}
      className="fixed z-[60] w-56 rounded-xl border border-ink-line bg-ink-soft p-1.5 shadow-2xl"
    >
      <div className="truncate px-2.5 py-1 text-[11px] uppercase tracking-wide text-gelo-dim/70">
        {lead.empresa || lead.nome}
      </div>

      <button className={item} onClick={() => { onOpen(lead.id); onClose(); }}>
        <PanelRight className="h-3.5 w-3.5" /> Abrir painel
      </button>

      <div className="my-1 border-t border-ink-line" />
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-gelo-dim/70">
        <ArrowRightLeft className="h-3 w-3" /> Mover para
      </div>
      <div className="grid grid-cols-1 gap-0.5">
        {LEAD_STAGES.filter((s) => s.key !== lead.status).map((s) => (
          <button
            key={s.key}
            disabled={pending}
            onClick={() => { onMove(lead.id, s.key); onClose(); }}
            className={item}
          >
            <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
          </button>
        ))}
      </div>

      <div className="my-1 border-t border-ink-line" />
      <div className="px-2.5 py-1 text-[11px] text-gelo-dim/70">Prioridade</div>
      <div className="flex gap-1 px-2.5 pb-1">
        {LEAD_PRIORIDADES.map((p) => (
          <button
            key={p.key}
            disabled={pending}
            title={p.label}
            onClick={() => run(() => setLeadPrioridade(lead.id, p.key))}
            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
              lead.prioridade === p.key ? "border-roxo-light/60 bg-roxo/15" : "border-ink-line hover:border-roxo-light/40"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${p.dot}`} />
          </button>
        ))}
      </div>

      <div className="my-1 border-t border-ink-line" />
      {lead.status !== "convertido" && (
        <button className={`${item} text-emerald-300/90 hover:text-emerald-200`} disabled={pending} onClick={() => acaoForm(convertLeadToClient)}>
          <UserRoundCheck className="h-3.5 w-3.5" /> Converter em cliente
        </button>
      )}
      {lead.status !== "perdido" && (
        <button className={`${item} text-red-300/80 hover:text-red-300`} disabled={pending} onClick={() => acaoForm(markLeadLost)}>
          <CircleSlash className="h-3.5 w-3.5" /> Marcar perdido
        </button>
      )}
      <button className={`${item} text-red-300/70 hover:text-red-300`} disabled={pending} onClick={() => acaoForm(deleteLead)}>
        <Trash2 className="h-3.5 w-3.5" /> Excluir
      </button>
    </div>
  );
}
