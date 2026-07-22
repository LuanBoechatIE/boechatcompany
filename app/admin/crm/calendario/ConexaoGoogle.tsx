"use client";

import { useState, useTransition } from "react";
import {
  CalendarCheck2,
  RefreshCw,
  Unplug,
  Link2,
  CircleCheck,
  CircleX,
  CircleDashed,
  TriangleAlert,
} from "lucide-react";
import { sincronizarAgora, desconectarGoogle, type ConexaoView } from "@/app/admin/calendario-actions";

function Badge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: typeof CircleCheck; txt: string }> = {
    conectado: { cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90", icon: CircleCheck, txt: "Conectado" },
    expirado: { cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-200/90", icon: TriangleAlert, txt: "Token expirado" },
    erro: { cls: "border-red-500/30 bg-red-500/10 text-red-300", icon: CircleX, txt: "Erro" },
    desconectado: { cls: "border-ink-line text-gelo-dim", icon: CircleDashed, txt: "Desconectado" },
  };
  const s = map[status] ?? map.desconectado;
  const Icon = s.icon;
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${s.cls}`}>
      <Icon className="h-3.5 w-3.5" /> {s.txt}
    </span>
  );
}

export function ConexaoGoogle({
  view,
  onSynced,
}: {
  view: ConexaoView;
  onSynced?: (msg: string, erro?: boolean) => void;
}) {
  const [pending, start] = useTransition();
  const [aberto, setAberto] = useState(!view.conectado);

  function sincronizar() {
    start(async () => {
      const r = await sincronizarAgora();
      onSynced?.(
        r.ok ? `Sincronizado: ${r.atualizados} atualizados, ${r.cancelados} cancelados.` : r.erro ?? "Falha.",
        !r.ok,
      );
    });
  }
  function desconectar() {
    if (!window.confirm("Desconectar a conta do Google Agenda?")) return;
    start(async () => {
      await desconectarGoogle();
      onSynced?.("Conta desconectada.");
    });
  }

  if (!view.configurado) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 text-sm text-yellow-100/90">
        <p className="flex items-center gap-2 font-medium text-gelo">
          <TriangleAlert className="h-4 w-4 text-yellow-300" /> Google Agenda não configurado
        </p>
        <p className="mt-2">Defina na Vercel as variáveis de ambiente:</p>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {view.faltando.map((v) => (
            <li key={v}><code className="text-roxo-light">{v}</code></li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck2 className="h-5 w-5 text-roxo-light" />
          <div>
            <p className="text-sm font-medium text-gelo">
              {view.conectado ? view.email || "Conta Google conectada" : "Google Agenda"}
            </p>
            <p className="text-xs text-gelo-dim">
              {view.conectado
                ? `Calendário: ${view.calendarId}${view.ultimaSyncLabel ? ` · Última sync: ${view.ultimaSyncLabel}` : ""}`
                : "Conecte a agenda da agência para sincronizar eventos e reuniões."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={view.status} />
          <button
            onClick={() => setAberto((a) => !a)}
            className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo"
          >
            {aberto ? "Ocultar" : "Gerenciar"}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-line/60 pt-4">
          {!view.conectado || view.status !== "conectado" ? (
            <a
              href="/admin/api/google/oauth/start"
              className="flex items-center gap-2 rounded-lg bg-roxo px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <Link2 className="h-4 w-4" />
              {view.conectado ? "Reconectar Google Agenda" : "Conectar Google Agenda"}
            </a>
          ) : null}

          {view.conectado && (
            <>
              <button
                onClick={sincronizar}
                disabled={pending}
                className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
                {pending ? "Sincronizando…" : "Sincronizar agora"}
              </button>
              <a
                href="/admin/api/google/oauth/start"
                className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:text-gelo"
              >
                <Link2 className="h-4 w-4" /> Reconectar
              </a>
              <button
                onClick={desconectar}
                disabled={pending}
                className="ml-auto flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-4 py-2 text-sm text-red-300/80 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
              >
                <Unplug className="h-4 w-4" /> Desconectar
              </button>
            </>
          )}
          {view.connectedBy && view.conectado && (
            <span className="w-full text-[11px] text-gelo-dim/60">Conectado por {view.connectedBy}</span>
          )}
        </div>
      )}
    </div>
  );
}
