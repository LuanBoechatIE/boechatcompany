"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Play, Pause, RotateCcw, Square, Clock, Loader2 } from "lucide-react";
import {
  getMeuPonto,
  iniciarExpediente,
  pausarPonto,
  retomarPonto,
  encerrarExpediente,
  type PontoView,
} from "@/app/admin/ponto-actions";

function hms(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [h, m, ss].map((x) => String(x).padStart(2, "0")).join(":");
}

const STATUS = {
  nao_iniciado: { txt: "Não iniciado", cls: "border-ink-line text-gelo-dim" },
  trabalhando: { txt: "Trabalhando", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  pausa: { txt: "Em pausa", cls: "border-yellow-500/40 bg-yellow-500/10 text-yellow-200/90" },
  encerrado: { txt: "Expediente encerrado", cls: "border-ink-line text-gelo-dim" },
};

export function MeuPontoCard() {
  const [ponto, setPonto] = useState<PontoView | null>(null);
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const baseRef = useRef<{ worked: number; paused: number; desde: number } | null>(null);

  const carregar = useCallback(async () => {
    const p = await getMeuPonto();
    setPonto(p);
    baseRef.current = { worked: p.workedSeconds, paused: p.pausedSeconds, desde: p.desdeISO ? Date.parse(p.desdeISO) : Date.now() };
    setTick(0);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Contador ao vivo (valor oficial vem do servidor a cada ação/refresh).
  useEffect(() => {
    if (ponto?.status !== "trabalhando" && ponto?.status !== "pausa") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [ponto?.status]);

  function acao(fn: () => Promise<{ ok: boolean; erro?: string }>, okMsg: string, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    start(async () => {
      const r = await fn();
      setToast(r.ok ? okMsg : r.erro ?? "Falha.");
      setTimeout(() => setToast(null), 3000);
      if (r.ok) await carregar();
    });
  }

  if (!ponto) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ink-line bg-ink-soft/30 p-5 text-sm text-gelo-dim">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando ponto…
      </div>
    );
  }

  const st = STATUS[ponto.status];
  const extra = baseRef.current && ponto.status === "trabalhando" ? Math.floor((Date.now() - baseRef.current.desde) / 1000) : 0;
  const extraPausa = baseRef.current && ponto.status === "pausa" ? Math.floor((Date.now() - baseRef.current.desde) / 1000) : 0;
  const trabalhado = (baseRef.current?.worked ?? ponto.workedSeconds) + extra;
  const pausado = (baseRef.current?.paused ?? ponto.pausedSeconds) + extraPausa;
  void tick; // força re-render a cada segundo

  const btn = "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <Clock className="h-4 w-4" /> Meu ponto
        </h3>
        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase ${st.cls}`}>{st.txt}</span>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <div className="font-display text-3xl leading-none text-gelo tabular-nums">{hms(trabalhado)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-gelo-dim">Trabalhado hoje</div>
        </div>
        <div>
          <div className="font-display text-xl leading-none text-gelo-dim tabular-nums">{hms(pausado)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wide text-gelo-dim">Em pausa</div>
        </div>
        <div className="text-xs text-gelo-dim">
          {ponto.inicioLabel && <div>Início: {ponto.inicioLabel}</div>}
          {ponto.ultimaAcaoLabel && <div>{ponto.ultimaAcaoLabel}</div>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ponto.status === "nao_iniciado" && (
          <button disabled={pending} onClick={() => acao(iniciarExpediente, "Expediente iniciado.")} className={`${btn} bg-emerald-600/80 text-white hover:bg-emerald-600`}>
            <Play className="h-4 w-4" /> Iniciar expediente
          </button>
        )}
        {ponto.status === "trabalhando" && (
          <>
            <button disabled={pending} onClick={() => acao(pausarPonto, "Pausado.")} className={`${btn} border border-ink-line bg-ink text-gelo-dim hover:text-gelo`}>
              <Pause className="h-4 w-4" /> Pausar
            </button>
            <button disabled={pending} onClick={() => acao(encerrarExpediente, "Expediente encerrado.", "Encerrar o expediente de hoje?")} className={`${btn} border border-red-500/30 bg-ink text-red-300 hover:bg-red-500/10`}>
              <Square className="h-4 w-4" /> Encerrar
            </button>
          </>
        )}
        {ponto.status === "pausa" && (
          <>
            <button disabled={pending} onClick={() => acao(retomarPonto, "Retomado.")} className={`${btn} bg-emerald-600/80 text-white hover:bg-emerald-600`}>
              <RotateCcw className="h-4 w-4" /> Retomar
            </button>
            <button disabled={pending} onClick={() => acao(encerrarExpediente, "Expediente encerrado.", "Encerrar o expediente de hoje?")} className={`${btn} border border-red-500/30 bg-ink text-red-300 hover:bg-red-500/10`}>
              <Square className="h-4 w-4" /> Encerrar
            </button>
          </>
        )}
        {ponto.status === "encerrado" && <span className="text-xs text-gelo-dim">Expediente de hoje encerrado. Volte amanhã. 👋</span>}
      </div>

      {toast && <div className="mt-3 rounded-lg border border-ink-line bg-ink px-3 py-2 text-xs text-gelo-dim">{toast}</div>}
    </div>
  );
}
