"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Loader2, X, ShieldCheck, Tag, Power, KeyRound, Check, Trash2 } from "lucide-react";
import {
  listCargos,
  criarCargo,
  atualizarCargo,
  listUsuariosGestao,
  atribuirCargo,
  removerCargo,
  definirSuperAdmin,
  getMatrizPermissoes,
  definirPermissaoUsuario,
  listRoles,
  criarRole,
  atualizarRole,
  excluirRole,
  atribuirRoleUsuario,
  removerRoleUsuario,
  getMatrizRole,
  definirPermissaoRole,
  type CargoView,
  type UsuarioGestao,
  type RoleView,
} from "@/app/admin/roles-actions";

const cardCls = "rounded-2xl border border-ink-line bg-ink-soft/30 p-5";
const inputCls =
  "rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";

function iniciais(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

// Modal genérico de matriz de permissões: serve tanto pra um usuário
// individual (override pontual) quanto pra um cargo de acesso (role,
// aplicado a todos que o têm). O formato {modulo,label,acoes,concedidas}
// é o mesmo nos dois casos — evita duplicar o modal duas vezes.
type MatrizAberta = {
  titulo: string;
  sub: string;
  bloqueadaMsg?: string;
  concedidas: string[] | null;
  modulos: { modulo: string; label: string; acoes: { chave: string; label: string }[] }[] | null;
  onToggle: (chave: string, ligar: boolean) => void;
};

export function CargosPermissoes() {
  const [cargos, setCargos] = useState<CargoView[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioGestao[]>([]);
  const [rolesAcesso, setRolesAcesso] = useState<RoleView[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [, start] = useTransition();

  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("#a78bfa");
  const [novoRoleNome, setNovoRoleNome] = useState("");
  const [novoRoleDesc, setNovoRoleDesc] = useState("");
  const [matriz, setMatriz] = useState<MatrizAberta | null>(null);

  async function recarregar() {
    try {
      const [cs, us, rs] = await Promise.all([listCargos(), listUsuariosGestao(), listRoles()]);
      setCargos(cs);
      setUsuarios(us);
      setRolesAcesso(rs);
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

  // ── Cargos de acesso (roles reais, com permissão de verdade) ──────────────

  function criarRoleAcesso() {
    if (!novoRoleNome.trim()) return;
    const fd = new FormData();
    fd.set("nome", novoRoleNome.trim());
    fd.set("descricao", novoRoleDesc.trim());
    acao(() => criarRole(fd), "Cargo de acesso criado.");
    setNovoRoleNome("");
    setNovoRoleDesc("");
  }

  function toggleRoleAtivo(r: RoleView) {
    const fd = new FormData();
    fd.set("id", String(r.id));
    fd.set("nome", r.nome);
    fd.set("descricao", r.descricao);
    fd.set("ativo", String(!r.ativo));
    acao(() => atualizarRole(fd), r.ativo ? "Cargo desativado." : "Cargo ativado.");
  }

  async function excluirRoleAcesso(r: RoleView) {
    const fd = new FormData();
    fd.set("id", String(r.id));
    const primeira = await excluirRole(fd);
    if (primeira.ok) { notificar("Cargo excluído."); await recarregar(); return; }
    if (primeira.usuariosAfetados) {
      if (!window.confirm(`${primeira.usuariosAfetados} conta(s) usam "${r.nome}". Excluir mesmo assim? Elas perdem esse cargo.`)) return;
      fd.set("forcar", "true");
      acao(() => excluirRole(fd), "Cargo excluído.");
      return;
    }
    notificar(primeira.erro ?? "Falha.", true);
  }

  function addRoleUsuario(usuarioId: number, roleId: number) {
    if (!roleId) return;
    const fd = new FormData();
    fd.set("usuarioId", String(usuarioId));
    fd.set("roleId", String(roleId));
    acao(() => atribuirRoleUsuario(fd), "Cargo de acesso atribuído.");
  }

  function tirarRoleUsuario(usuarioId: number, roleId: number) {
    const fd = new FormData();
    fd.set("usuarioId", String(usuarioId));
    fd.set("roleId", String(roleId));
    acao(() => removerRoleUsuario(fd), "Cargo de acesso removido.");
  }

  // ── Matriz de permissões (compartilhada: usuário individual ou cargo) ────

  async function abrirMatrizUsuario(u: UsuarioGestao) {
    setMatriz({ titulo: `Permissões de ${u.nome}`, sub: `@${u.username} · acesso pontual (sem ser superadmin)`, concedidas: null, modulos: null, onToggle: () => {} });
    try {
      const view = await getMatrizPermissoes(u.id);
      if (view.superAdmin) {
        setMatriz({ titulo: `Permissões de ${u.nome}`, sub: `@${u.username}`, bloqueadaMsg: "Superadministrador tem todas as permissões.", concedidas: null, modulos: null, onToggle: () => {} });
        return;
      }
      setMatriz({
        titulo: `Permissões de ${u.nome}`,
        sub: `@${u.username} · marque para conceder acesso pontual (sem ser superadmin)`,
        concedidas: view.concedidas,
        modulos: view.modulos,
        onToggle: (chave, ligar) => {
          const fd = new FormData();
          fd.set("usuarioId", String(u.id));
          fd.set("chave", chave);
          fd.set("estado", ligar ? "on" : "off");
          setMatriz((m) => m && m.concedidas ? { ...m, concedidas: ligar ? [...new Set([...m.concedidas, chave])] : m.concedidas.filter((c) => c !== chave) } : m);
          start(async () => {
            const r = await definirPermissaoUsuario(fd);
            if (!r.ok) { notificar(r.erro ?? "Falha.", true); await abrirMatrizUsuario(u); }
          });
        },
      });
    } catch {
      notificar("Falha ao carregar permissões.", true);
      setMatriz(null);
    }
  }

  async function abrirMatrizRole(r: RoleView) {
    setMatriz({ titulo: `Permissões do cargo "${r.nome}"`, sub: `${r.qtdUsuarios} conta(s) com este cargo`, concedidas: null, modulos: null, onToggle: () => {} });
    try {
      const view = await getMatrizRole(r.id);
      setMatriz({
        titulo: `Permissões do cargo "${r.nome}"`,
        sub: `${r.qtdUsuarios} conta(s) com este cargo · aplica na hora pra todos que o têm`,
        concedidas: view.concedidas,
        modulos: view.modulos,
        onToggle: (chave, ligar) => {
          const fd = new FormData();
          fd.set("roleId", String(r.id));
          fd.set("chave", chave);
          fd.set("estado", ligar ? "on" : "off");
          setMatriz((m) => m && m.concedidas ? { ...m, concedidas: ligar ? [...new Set([...m.concedidas, chave])] : m.concedidas.filter((c) => c !== chave) } : m);
          start(async () => {
            const res = await definirPermissaoRole(fd);
            if (!res.ok) { notificar(res.erro ?? "Falha.", true); await abrirMatrizRole(r); }
          });
        },
      });
    } catch {
      notificar("Falha ao carregar permissões.", true);
      setMatriz(null);
    }
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

      {/* Cargos de acesso: permissão real, por módulo/página/ação */}
      <div className={cardCls}>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <KeyRound className="h-4 w-4" /> Cargos de acesso
        </h3>
        <p className="mb-4 text-xs text-gelo-dim">Determinam o que cada funcionário vê e pode fazer no sistema (abas, páginas, ações).</p>

        <div className="mb-4 flex flex-wrap items-end gap-2">
          <input value={novoRoleNome} onChange={(e) => setNovoRoleNome(e.target.value)} placeholder="Nome do cargo" className={inputCls} />
          <input value={novoRoleDesc} onChange={(e) => setNovoRoleDesc(e.target.value)} placeholder="Descrição (opcional)" className={`${inputCls} min-w-48 flex-1`} />
          <button onClick={criarRoleAcesso} className="flex items-center gap-1.5 rounded-lg bg-roxo px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Criar
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {rolesAcesso.length === 0 && <li className="text-sm text-gelo-dim">Nenhum cargo de acesso criado ainda.</li>}
          {rolesAcesso.map((r) => (
            <li key={r.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-line bg-ink/40 p-3 ${!r.ativo ? "opacity-50" : ""}`}>
              <div>
                <div className="text-sm text-gelo">{r.nome} <span className="text-xs text-gelo-dim">· {r.qtdUsuarios} conta(s)</span></div>
                {r.descricao && <div className="text-xs text-gelo-dim">{r.descricao}</div>}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => abrirMatrizRole(r)} className="flex items-center gap-1.5 rounded-lg border border-ink-line px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
                  <KeyRound className="h-3.5 w-3.5" /> Permissões
                </button>
                <button onClick={() => toggleRoleAtivo(r)} className="text-gelo-dim hover:text-gelo" title={r.ativo ? "Desativar" : "Ativar"}>
                  <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => excluirRoleAcesso(r)} className="text-gelo-dim hover:text-red-300" title="Excluir cargo">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Catálogo de cargos cosméticos (rótulo profissional, sem permissão) */}
      <div className={cardCls}>
        <h3 className="mb-1 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <Tag className="h-4 w-4" /> Cargos (rótulo)
        </h3>
        <p className="mb-4 text-xs text-gelo-dim">Função profissional exibida no perfil. Não concede acesso — use "Cargos de acesso" acima pra isso.</p>

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
            const rolesDisponiveis = rolesAcesso.filter((r) => r.ativo && !u.rolesAcesso.some((x) => x.id === r.id));
            return (
              <li key={u.id} className="flex flex-col gap-3 rounded-xl border border-ink-line bg-ink/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
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

                  <div className="flex shrink-0 items-center gap-1.5">
                    {!u.superAdmin && (
                      <button onClick={() => abrirMatrizUsuario(u)} className="flex items-center gap-1.5 rounded-lg border border-ink-line px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
                        <KeyRound className="h-3.5 w-3.5" /> Exceções individuais
                      </button>
                    )}
                    {u.protegido ? (
                      <span className="rounded-lg border border-roxo/40 bg-roxo/10 px-3 py-1.5 text-xs text-roxo-light">Conta protegida</span>
                    ) : (
                      <button
                        onClick={() => toggleSuper(u)}
                        className={`rounded-lg border px-3 py-1.5 text-xs ${u.superAdmin ? "border-red-500/30 text-red-300/80 hover:bg-red-500/10" : "border-ink-line text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"}`}
                      >
                        {u.superAdmin ? "Remover superadmin" : "Tornar superadmin"}
                      </button>
                    )}
                  </div>
                </div>

                {!u.superAdmin && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wide text-gelo-dim">Cargo de acesso (permissões herdadas)</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.rolesAcesso.map((r) => (
                        <span key={r.id} className="flex items-center gap-1 rounded-full border border-roxo/30 bg-roxo/10 px-2.5 py-1 text-xs text-roxo-light">
                          {r.nome}
                          <button onClick={() => tirarRoleUsuario(u.id, r.id)} className="text-roxo-light/70 hover:text-red-300"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                      {rolesDisponiveis.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => addRoleUsuario(u.id, Number(e.target.value))}
                          className="rounded-lg border border-ink-line bg-ink px-2 py-1 text-xs text-gelo-dim"
                        >
                          <option value="">+ cargo de acesso</option>
                          {rolesDisponiveis.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                        </select>
                      )}
                      {u.rolesAcesso.length === 0 && rolesDisponiveis.length === 0 && <span className="text-xs text-gelo-dim">Nenhum cargo de acesso criado.</span>}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-gelo-dim">Cargo (rótulo profissional)</div>
                  <div className="flex flex-wrap items-center gap-1.5">
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
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {matriz && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
              <div>
                <h3 className="font-display text-base uppercase text-gelo">{matriz.titulo}</h3>
                <p className="text-xs text-gelo-dim">{matriz.sub}</p>
              </div>
              <button onClick={() => setMatriz(null)} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {matriz.bloqueadaMsg ? (
                <p className="rounded-xl border border-roxo/30 bg-roxo/5 p-4 text-sm text-roxo-light">{matriz.bloqueadaMsg}</p>
              ) : !matriz.modulos ? (
                <div className="flex items-center gap-2 p-6 text-sm text-gelo-dim"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {matriz.modulos.map((m) => (
                    <div key={m.modulo}>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">{m.label}</h4>
                      <div className="flex flex-wrap gap-2">
                        {m.acoes.map((a) => {
                          const on = matriz.concedidas!.includes(a.chave);
                          return (
                            <button
                              key={a.chave}
                              onClick={() => matriz.onToggle(a.chave, !on)}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${on ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200" : "border-ink-line bg-ink text-gelo-dim hover:text-gelo"}`}
                            >
                              {on && <Check className="h-3 w-3" />} {a.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end border-t border-ink-line px-5 py-4">
              <button onClick={() => setMatriz(null)} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Concluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
