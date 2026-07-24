"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Eye, EyeOff, Wand2, Copy, KeyRound, AtSign, User, ShieldCheck } from "lucide-react";
import {
  editarUsuario,
  alterarLoginUsuario,
  redefinirSenhaUsuario,
  gerarSenhaTemporaria,
  type UsuarioAdmin,
} from "@/app/admin/usuarios-actions";
import {
  listRoles,
  atribuirCargo,
  removerCargo,
  atribuirRoleUsuario,
  removerRoleUsuario,
  getMatrizPermissoes,
  definirPermissaoUsuario,
  listUsuariosGestao,
  type CargoView,
  type RoleView,
  type MatrizPermissoesView,
} from "@/app/admin/roles-actions";

const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

function CampoSenha({ valor, onChange, placeholder }: { valor: string; onChange: (v: string) => void; placeholder?: string }) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input type={ver ? "text" : "password"} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" className={`${inputCls} pr-10`} />
      <button type="button" onClick={() => setVer((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gelo-dim hover:text-gelo">
        {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type Tab = "conta" | "permissoes";

// Painel único por funcionário: reúne dados da conta (nome/cargo/e-mail/
// login/status/senha) e, pra quem pode gerenciar cargos/permissões
// (superadmin — mesma trava de roles-actions.ts), cargo de acesso +
// matriz de permissões individuais, num só lugar em vez de modais soltos.
export function FuncionarioPainel({
  usuario,
  cargos,
  superAdmin,
  onClose,
  onAtualizado,
  notificar,
}: {
  usuario: UsuarioAdmin;
  cargos: CargoView[];
  superAdmin: boolean;
  onClose: () => void;
  onAtualizado: () => Promise<void>;
  notificar: (msg: string, erro?: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("conta");
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [novoLogin, setNovoLogin] = useState(usuario.username);
  const [novaSenha, setNovaSenha] = useState("");
  const [trocarSenha, setTrocarSenha] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();

  const [roles, setRoles] = useState<RoleView[]>([]);
  const [rolesDoUsuario, setRolesDoUsuario] = useState<Set<number>>(new Set());
  const [matriz, setMatriz] = useState<MatrizPermissoesView | null>(null);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(false);

  async function carregarPermissoes() {
    setCarregandoPermissoes(true);
    try {
      const [rs, gestao, m] = await Promise.all([listRoles(), listUsuariosGestao(), getMatrizPermissoes(usuario.id)]);
      setRoles(rs);
      const atual = gestao.find((g) => g.id === usuario.id);
      setRolesDoUsuario(new Set((atual?.rolesAcesso ?? []).map((r) => r.id)));
      setMatriz(m);
    } finally {
      setCarregandoPermissoes(false);
    }
  }

  useEffect(() => {
    if (tab !== "permissoes" || !superAdmin) return;
    carregarPermissoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, superAdmin]);

  function acao(fn: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string) {
    start(async () => {
      const r = await fn();
      notificar(r.ok ? sucesso : r.erro ?? "Falha.", !r.ok);
      if (r.ok) await onAtualizado();
    });
  }

  function salvarDados() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("nome", nome);
    fd.set("email", email);
    acao(() => editarUsuario(fd), "Dados atualizados.");
  }

  function salvarLogin() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("novoLogin", novoLogin);
    acao(() => alterarLoginUsuario(fd), "Login alterado.");
  }

  async function gerarSenha() { setNovaSenha(await gerarSenhaTemporaria()); }
  function copiarSenha() { navigator.clipboard.writeText(novaSenha); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
  function salvarSenha() {
    if (!novaSenha) return;
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("senha", novaSenha);
    fd.set("trocar", String(trocarSenha));
    acao(() => redefinirSenhaUsuario(fd), "Senha redefinida.");
    setNovaSenha("");
  }

  function toggleCargo(cargoId: number, ligar: boolean) {
    const fd = new FormData();
    fd.set("usuarioId", String(usuario.id));
    fd.set("cargoId", String(cargoId));
    acao(() => (ligar ? atribuirCargo(fd) : removerCargo(fd)), ligar ? "Cargo atribuído." : "Cargo removido.");
  }

  function toggleRole(roleId: number, ligar: boolean) {
    const fd = new FormData();
    fd.set("usuarioId", String(usuario.id));
    fd.set("roleId", String(roleId));
    start(async () => {
      const r = await (ligar ? atribuirRoleUsuario(fd) : removerRoleUsuario(fd));
      notificar(r.ok ? (ligar ? "Cargo de acesso atribuído." : "Cargo de acesso removido.") : r.erro ?? "Falha.", !r.ok);
      if (r.ok) await carregarPermissoes();
    });
  }

  function togglePermissao(chave: string, ligar: boolean) {
    const fd = new FormData();
    fd.set("usuarioId", String(usuario.id));
    fd.set("chave", chave);
    fd.set("estado", ligar ? "on" : "off");
    start(async () => {
      const r = await definirPermissaoUsuario(fd);
      notificar(r.ok ? "Permissão atualizada." : r.erro ?? "Falha.", !r.ok);
      if (r.ok) await carregarPermissoes();
    });
  }

  const cargosAtivos = cargos.filter((c) => c.ativo);
  const cargosIds = new Set(usuario.cargos.map((c) => c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <div>
            <h3 className="font-display text-lg uppercase text-gelo">{usuario.nome}</h3>
            <p className="text-xs text-gelo-dim">{usuario.username}{usuario.email ? ` · ${usuario.email}` : ""}</p>
          </div>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-1 border-b border-ink-line px-5">
          <button onClick={() => setTab("conta")} className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${tab === "conta" ? "border-roxo-light font-medium text-gelo" : "border-transparent text-gelo-dim hover:text-gelo"}`}>
            <User className="h-3.5 w-3.5" /> Conta
          </button>
          {superAdmin && (
            <button onClick={() => setTab("permissoes")} className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm ${tab === "permissoes" ? "border-roxo-light font-medium text-gelo" : "border-transparent text-gelo-dim hover:text-gelo"}`}>
              <ShieldCheck className="h-3.5 w-3.5" /> Cargo & Permissões
            </button>
          )}
        </div>

        {tab === "conta" && (
          <div className="flex flex-col gap-5 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1"><span className={lbl}>Nome completo</span><input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} /></label>
              <label className="flex flex-col gap-1"><span className={lbl}>E-mail</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} /></label>
            </div>
            <div>
              <span className={lbl}>Status</span>
              <div className="mt-1 text-sm text-gelo">
                {usuario.status === "bloqueado" ? <span className="text-red-300">Bloqueado</span> : <span className="text-emerald-300">Ativo</span>}
                {usuario.protegido && <span className="ml-2 text-[11px] text-roxo-light/80">(conta protegida)</span>}
              </div>
            </div>
            <button onClick={salvarDados} disabled={pending} className="self-start rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Salvar dados</button>

            {cargosAtivos.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-ink-line pt-4">
                <span className={lbl}>Cargos (rótulo profissional)</span>
                <div className="flex flex-wrap gap-2">
                  {cargosAtivos.map((c) => {
                    const on = cargosIds.has(c.id);
                    return (
                      <button key={c.id} type="button" disabled={pending} onClick={() => toggleCargo(c.id, !on)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${on ? "border-roxo-light bg-roxo/20 text-gelo" : "border-ink-line text-gelo-dim"}`}>
                        <span className="h-2 w-2 rounded-full" style={{ background: c.cor }} /> {c.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {superAdmin && (
              <>
                <div className="flex flex-col gap-2 border-t border-ink-line pt-4">
                  <span className={lbl}><AtSign className="mr-1 inline h-3 w-3" /> Login (só superadmin altera)</span>
                  <div className="flex gap-2">
                    <input value={novoLogin} onChange={(e) => setNovoLogin(e.target.value.toLowerCase())} className={inputCls} />
                    <button onClick={salvarLogin} disabled={pending || novoLogin === usuario.username} className="shrink-0 rounded-lg border border-ink-line bg-ink px-4 text-sm text-gelo-dim hover:text-gelo disabled:opacity-40">Alterar</button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-ink-line pt-4">
                  <span className={lbl}><KeyRound className="mr-1 inline h-3 w-3" /> Redefinir senha</span>
                  <div className="flex gap-2">
                    <div className="flex-1"><CampoSenha valor={novaSenha} onChange={setNovaSenha} placeholder="mín. 8, letra + número" /></div>
                    <button type="button" onClick={gerarSenha} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo"><Wand2 className="h-3.5 w-3.5" /> Gerar</button>
                    <button type="button" onClick={copiarSenha} disabled={!novaSenha} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo disabled:opacity-40"><Copy className="h-3.5 w-3.5" /> {copiado ? "Copiado" : "Copiar"}</button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gelo-dim"><input type="checkbox" checked={trocarSenha} onChange={(e) => setTrocarSenha(e.target.checked)} /> Exigir troca no próximo acesso</label>
                  <button onClick={salvarSenha} disabled={pending || !novaSenha} className="self-start rounded-lg border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:text-gelo disabled:opacity-40">Salvar senha</button>
                  <span className="text-[11px] text-gelo-dim/50">A senha atual nunca é exibida (hash). Entregue a nova de forma segura.</span>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "permissoes" && superAdmin && (
          <div className="flex flex-col gap-5 p-5">
            {carregandoPermissoes || !matriz ? (
              <div className="py-6 text-center text-sm text-gelo-dim">Carregando…</div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className={lbl}>Cargos de acesso (concedem permissões de verdade)</span>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((r) => {
                      const on = rolesDoUsuario.has(r.id);
                      return (
                        <button key={r.id} type="button" disabled={pending} onClick={() => toggleRole(r.id, !on)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-roxo-light bg-roxo/20 text-gelo" : "border-ink-line text-gelo-dim"}`}>
                          {r.nome}
                        </button>
                      );
                    })}
                    {roles.length === 0 && <span className="text-xs text-gelo-dim/60">Nenhum cargo de acesso criado ainda.</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-ink-line pt-4">
                  <span className={lbl}>Permissões individuais (concessão pontual, além do cargo de acesso)</span>
                  {matriz.superAdmin ? (
                    <p className="text-sm text-gelo-dim">Este usuário é superadministrador: tem acesso total, overrides individuais não se aplicam.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {matriz.modulos.map((mod) => (
                        <div key={mod.modulo} className="rounded-xl border border-ink-line/60 p-3">
                          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gelo-dim">{mod.label}</div>
                          <div className="flex flex-wrap gap-2">
                            {mod.acoes.map((a) => {
                              const on = matriz.concedidas.includes(a.chave);
                              return (
                                <button key={a.chave} type="button" disabled={pending} onClick={() => togglePermissao(a.chave, !on)} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200" : "border-ink-line text-gelo-dim"}`}>
                                  {a.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
