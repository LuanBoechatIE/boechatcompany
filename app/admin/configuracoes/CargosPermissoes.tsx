"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Loader2, X, ShieldCheck, Tag, Power } from "lucide-react";
import {
  listCargos,
  criarCargo,
  atualizarCargo,
  listUsuariosGestao,
  atribuirCargo,
  removerCargo,
  definirSuperAdmin,
  type CargoView,
  type UsuarioGestao,
} from "@/app/admin/roles-actions";

const cardCls = "rounded-2xl border border-ink-line bg-ink-soft/30 p-5";
const inputCls =
  "rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";

function iniciais(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function CargosPermissoes() {
  const [cargos, setCargos] = useState<CargoView[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioGestao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [, start] = useTransition();

  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("#a78bfa");

  async function recarregar() {
    try {
      const [cs, us] = await Promise.all([listCargos(), listUsuariosGestao()]);
      setCargos(cs);
      setUsuarios(us);
    } catch {
      setToast({ msg: "Acesso restrito a superadministradores.", erro: true });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function notificar(msg: string, erro?: boolean) {
    setToast({ msg, erro });
    setTimeout(() => setToast(null), 3500);
  }

  function acao(fn: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string) {
    start(async () => {
      const r = await fn();
      notificar(r.ok ? sucesso : r.erro ?? "Falha.", !r.ok);
      if (r.ok) await recarregar();
    });
  }

  function criar() {
    if (!novoNome.trim()) return;
    const fd = new FormData();
    fd.set("nome", novoNome.trim());
    fd.set("cor", novaCor);
    acao(() => criarCargo(fd), "Cargo criado.");
    setNovoNome("");
  }

  function toggleAtivo(c: CargoView) {
    const fd = new FormData();
    fd.set("id", String(c.id));
    fd.set("nome", c.nome);
    fd.set("cor", c.cor);
    fd.set("ativo", String(!c.ativo));
    acao(() => atualizarCargo(fd), c.ativo ? "Cargo desativado." : "Cargo ativado.");
  }

  function addCargo(usuarioId: number, cargoId: number) {
    if (!cargoId) return;
    const fd = new FormData();
    fd.set("usuarioId", String(usuarioId));
    fd.set("cargoId", String(cargoId));
    acao(() => atribuirCargo(fd), "Cargo atribuído.");
  }

  function tirarCargo(usuarioId: number, cargoId: number) {
    const fd = new FormData();
    fd.set("usuarioId", String(usuarioId));
    fd.set("cargoId", String(cargoId));
    acao(() => removerCargo(fd), "Cargo removido.");
  }

  function toggleSuper(u: UsuarioGestao) {
    const acaoTxt = u.superAdmin ? "remover o superadmin de" : "tornar superadmin";
    if (!window.confirm(`Confirma ${acaoTxt} ${u.nome}?`)) return;
    const fd = new FormData();
    fd.set("usuarioId", String(u.id));
    fd.set("ativar", String(!u.superAdmin));
    acao(() => definirSuperAdmin(fd), "Permissão atualizada.");
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-gelo-dim">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm ${toast.erro ? "border-red-500/30 bg-red-500/5 text-red-200/90" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90"}`}>
          {toast.msg}
        </div>
      )}

      {/* Catálogo de cargos */}
      <div className={cardCls}>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <Tag className="h-4 w-4" /> Cargos
        </h3>
        <p className="mb-4 text-xs text-gelo-dim">Funções profissionais. Separadas das permissões de acesso.</p>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Novo cargo" className={inputCls} />
          <input type="color" value={novaCor} onChange={(e) => setNovaCor(e.target.value)} className="h-10 w-12 rounded-lg border border-ink-line bg-ink" aria-label="Cor" />
          <button onClick={criar} className="flex items-center gap-1.5 rounded-lg bg-roxo px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {cargos.map((c) => (
            <div key={c.id} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${c.ativo ? "border-ink-line bg-ink" : "border-ink-line/50 bg-ink/40 opacity-50"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.cor }} />
              <span className="text-gelo">{c.nome}</span>
              <button onClick={() => toggleAtivo(c)} className="text-gelo-dim hover:text-gelo" title={c.ativo ? "Desativar" : "Ativar"}>
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Usuários */}
      <div className={cardCls}>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <ShieldCheck className="h-4 w-4" /> Usuários, cargos e acesso
        </h3>
        <ul className="flex flex-col gap-3">
          {usuarios.map((u) => {
            const disponiveis = cargos.filter((c) => c.ativo && !u.cargos.some((x) => x.id === c.id));
            return (
              <li key={u.id} className="flex flex-col gap-3 rounded-xl border border-ink-line bg-ink/40 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  {u.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.foto} alt={u.nome} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-roxo/20 text-xs font-medium text-roxo-light">{iniciais(u.nome) || "?"}</span>
                  )}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gelo">
                      {u.nome}
                      {u.superAdmin && <span className="rounded-full border border-roxo/40 bg-roxo/10 px-2 py-0.5 text-[10px] uppercase text-roxo-light">Superadmin</span>}
                    </div>
                    <div className="text-xs text-gelo-dim">@{u.username}</div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                  {u.cargos.map((c) => (
                    <span key={c.id} className="flex items-center gap-1 rounded-full border border-ink-line bg-ink px-2.5 py-1 text-xs text-gelo">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.cor }} />
                      {c.nome}
                      <button onClick={() => tirarCargo(u.id, c.id)} className="text-gelo-dim hover:text-red-300"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                  {disponiveis.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => addCargo(u.id, Number(e.target.value))}
                      className="rounded-lg border border-ink-line bg-ink px-2 py-1 text-xs text-gelo-dim"
                    >
                      <option value="">+ cargo</option>
                      {disponiveis.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  )}
                </div>

                {u.protegido ? (
                  <span className="shrink-0 rounded-lg border border-roxo/40 bg-roxo/10 px-3 py-1.5 text-xs text-roxo-light">Conta protegida</span>
                ) : (
                  <button
                    onClick={() => toggleSuper(u)}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs ${u.superAdmin ? "border-red-500/30 text-red-300/80 hover:bg-red-500/10" : "border-ink-line text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"}`}
                  >
                    {u.superAdmin ? "Remover superadmin" : "Tornar superadmin"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
