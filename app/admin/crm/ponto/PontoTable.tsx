"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { listRegistrosPonto, listFuncionariosComPonto, type RegistroPonto, type FuncionarioBasico } from "@/app/admin/ponto-actions";

const inputCls = "rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";

function hms(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

function dataLabel(workDate: string): string {
  const [ano, mes, dia] = workDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function PontoTable() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioBasico[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [, start] = useTransition();

  async function carregar() {
    setCarregando(true);
    try {
      const [regs, funcs] = await Promise.all([
        listRegistrosPonto({ usuarioId: usuarioId ? Number(usuarioId) : undefined, de: de || undefined, ate: ate || undefined }),
        listFuncionariosComPonto(),
      ]);
      setRegistros(regs);
      setFuncionarios(funcs);
    } catch {
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filtrar() {
    start(carregar);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gelo-dim">Funcionário</span>
          <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)} className={inputCls}>
            <option value="">Todos</option>
            {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gelo-dim">De</span>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gelo-dim">Até</span>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className={inputCls} />
        </label>
        <button onClick={filtrar} className="flex items-center gap-1.5 rounded-lg bg-roxo px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <Search className="h-4 w-4" /> Filtrar
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 p-8 text-sm text-gelo-dim"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-line bg-ink-soft/40 text-left text-xs uppercase tracking-wide text-gelo-dim">
                <th className="px-4 py-3">Funcionário</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ativado</th>
                <th className="px-4 py-3">Encerrado</th>
                <th className="px-4 py-3">Tempo ativo</th>
                <th className="px-4 py-3">Em pausa</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id} className={`border-b border-ink-line/60 last:border-0 ${r.flagged ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 text-gelo">{r.nome}</td>
                  <td className="px-4 py-3 text-gelo-dim">{dataLabel(r.workDate)}</td>
                  <td className="px-4 py-3 text-gelo-dim">{r.inicioLabel ?? "—"}</td>
                  <td className="px-4 py-3 text-gelo-dim">{r.fimLabel ?? (r.status === "aberta" ? "em andamento" : "—")}</td>
                  <td className="px-4 py-3 text-gelo tabular-nums">{hms(r.workedSeconds)}</td>
                  <td className="px-4 py-3 text-gelo-dim tabular-nums">{hms(r.pausedSeconds)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] uppercase ${r.status === "aberta" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-ink-line text-gelo-dim"}`}>
                      {r.status === "aberta" ? "Ativo" : "Encerrado"}
                    </span>
                    {r.flagged && <span className="ml-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase text-red-300" title={r.flagReason}>Atenção</span>}
                  </td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gelo-dim">Nenhum registro de ponto encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
