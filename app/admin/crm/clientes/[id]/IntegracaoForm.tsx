"use client";

import {
  Plug,
  Save,
  Zap,
  RefreshCw,
  Unplug,
  CircleCheck,
  CircleX,
  CircleDashed,
} from "lucide-react";
import {
  META_CAMPOS,
  GOOGLE_CAMPOS,
  type IntegracaoView,
} from "@/app/lib/crm/types";
import {
  saveIntegracao,
  testIntegracao,
  syncIntegracao,
  disconnectIntegracao,
} from "../../../integracoes-actions";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

function StatusBadge({ status }: { status: string }) {
  if (status === "conectado")
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200/90">
        <CircleCheck className="h-3.5 w-3.5" /> Conectado
      </span>
    );
  if (status === "erro")
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
        <CircleX className="h-3.5 w-3.5" /> Erro na conexão
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
      <CircleDashed className="h-3.5 w-3.5" /> Desconectado
    </span>
  );
}

export function IntegracaoForm({
  clienteId,
  plataforma,
  label,
  view,
  cryptoOk,
}: {
  clienteId: number;
  plataforma: "meta" | "google";
  label: string;
  view: IntegracaoView;
  cryptoOk: boolean;
}) {
  const campos = plataforma === "meta" ? META_CAMPOS : GOOGLE_CAMPOS;

  function onSaveSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const temMascara = Object.keys(view.mascaras).length > 0;
    const alterandoSegredo = campos.segredos.some(
      (c) => (form.elements.namedItem(c.key) as HTMLInputElement)?.value.trim(),
    );
    if (temMascara && alterandoSegredo) {
      if (!window.confirm("Substituir as credenciais salvas desta integração?")) {
        e.preventDefault();
      }
    }
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <Plug className="h-4 w-4" /> {label}
        </h4>
        <StatusBadge status={view.status} />
      </div>

      {!cryptoOk && (
        <p className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200/90">
          Defina a variável <code>INTEGRATIONS_SECRET</code> na Vercel para
          habilitar o armazenamento criptografado das credenciais.
        </p>
      )}

      <form action={saveIntegracao} onSubmit={onSaveSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="clienteId" value={clienteId} />
        <input type="hidden" name="plataforma" value={plataforma} />

        <div className="grid gap-3 sm:grid-cols-2">
          {campos.dados.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className={lbl}>
                {c.label}
                {c.req && <span className="text-roxo-light"> *</span>}
              </span>
              <input
                name={c.key}
                defaultValue={view.dados[c.key] ?? ""}
                className={inputCls}
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {campos.segredos.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className={lbl}>{c.label}</span>
              <input
                name={c.key}
                type="password"
                autoComplete="off"
                placeholder={view.mascaras[c.key] ?? "••••••••"}
                className={inputCls}
              />
              {view.mascaras[c.key] && (
                <span className="text-[10px] text-gelo-dim/70">
                  Salvo: {view.mascaras[c.key]} (deixe em branco para manter)
                </span>
              )}
            </label>
          ))}
          {plataforma === "meta" && (
            <label className="flex flex-col gap-1">
              <span className={lbl}>Expiração do token (opcional)</span>
              <input name="tokenExpiraEm" type="date" className={inputCls} />
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={!cryptoOk}
            className="flex items-center gap-1.5 rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> Salvar integração
          </button>
        </div>
      </form>

      {/* Ações de conexão */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-line/60 pt-3">
        <form action={testIntegracao}>
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="plataforma" value={plataforma} />
          <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
            <Zap className="h-3.5 w-3.5" /> Testar conexão
          </button>
        </form>
        <form action={syncIntegracao}>
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="plataforma" value={plataforma} />
          <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
            <RefreshCw className="h-3.5 w-3.5" /> Sincronizar agora
          </button>
        </form>
        <form
          action={disconnectIntegracao}
          onSubmit={(e) => {
            if (!window.confirm("Desconectar e remover as credenciais desta integração?")) e.preventDefault();
          }}
          className="ml-auto"
        >
          <input type="hidden" name="clienteId" value={clienteId} />
          <input type="hidden" name="plataforma" value={plataforma} />
          <button className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:border-red-500/30 hover:text-red-300">
            <Unplug className="h-3.5 w-3.5" /> Desconectar
          </button>
        </form>
      </div>

      {/* Metadados / auditoria */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gelo-dim/70">
        {view.ultimaSyncLabel && <span>Última sync: {view.ultimaSyncLabel}</span>}
        {view.tokenExpiraLabel && <span>Token expira: {view.tokenExpiraLabel}</span>}
        {view.atualizadoPor && (
          <span>Alterado por {view.atualizadoPor}{view.atualizadoEmLabel ? ` em ${view.atualizadoEmLabel}` : ""}</span>
        )}
      </div>
    </div>
  );
}
