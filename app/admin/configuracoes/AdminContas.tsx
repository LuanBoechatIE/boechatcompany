"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Loader2, X, Search, Eye, EyeOff, KeyRound, Ban, CircleCheck, Pencil, Copy, Wand2, Trash2, RotateCcw, AtSign, ShieldAlert } from "lucide-react";
import {
  listUsuariosAdmin,
  criarUsuario,
  editarUsuario,
  definirStatusUsuario,
  redefinirSenhaUsuario,
  excluirUsuario,
  restaurarUsuario,
  alterarLoginUsuario,
  gerarSenhaTemporaria,
  gerarLoginUnico,
  type UsuarioAdmin,
} from "@/app/admin/usuarios-actions";
import { listCargos, type CargoView } from "@/app/admin/roles-actions";

const cardCls = "rounded-2xl border border-ink-line bg-ink-soft/30 p-5";
const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

function iniciais(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

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

export function AdminContas() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [cargos, setCargos] = useState<CargoView[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("todos");
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);
  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState<UsuarioAdmin | null>(null);
  const [reset, setReset] = useState<UsuarioAdmin | null>(null);
  const [excluir, setExcluir] = useState<UsuarioAdmin | null>(null);
  const [login, setLogin] = useState<UsuarioAdmin | null>(null);
  const [, start] = useTransition();

  async function recarregar() {
    try {
      const [us, cs] = await Promise.all([listUsuariosAdmin(), listCargos()]);
      setUsuarios(us);
      setCargos(cs);
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

  function acao(fn: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string, aoOk?: () => void) {
    start(async () => {
      const r = await fn();
      notificar(r.ok ? sucesso : r.erro ?? "Falha.", !r.ok);
      if (r.ok) {
        aoOk?.();
        await recarregar();
      }
    });
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (fStatus === "excluidos") { if (!u.excluido) return false; }
      else if (u.excluido) return false; // por padrão esconde excluídos
      else if (fStatus !== "todos" && u.status !== fStatus) return false;
      if (!q) return true;
      return u.nome.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [usuarios, busca, fStatus]);

  if (carregando) {
    return <div className="flex items-center gap-2 p-8 text-sm text-gelo-dim"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className={`rounded-xl border px-4 py-2.5 text-sm ${toast.erro ? "border-red-500/30 bg-red-500/5 text-red-200/90" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90"}`}>{toast.msg}</div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink px-3 py-2">
            <Search className="h-4 w-4 text-gelo-dim" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, login ou e-mail" className="w-56 bg-transparent text-sm text-gelo outline-none placeholder:text-gelo-dim/60" />
          </div>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-gelo-dim">
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="bloqueado">Bloqueados</option>
            <option value="excluidos">Excluídos</option>
          </select>
        </div>
        <button onClick={() => setNovo(true)} className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      <div className={cardCls}>
        <ul className="flex flex-col divide-y divide-ink-line/60">
          {filtrados.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                {u.foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.foto} alt={u.nome} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-roxo/20 text-xs font-medium text-roxo-light">{iniciais(u.nome) || "?"}</span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-gelo">
                    {u.nome}
                    {u.protegido && <span className="flex items-center gap-1 rounded-full border border-roxo/40 bg-roxo/10 px-2 py-0.5 text-[10px] uppercase text-roxo-light"><ShieldAlert className="h-3 w-3" /> Protegida</span>}
                    {u.superAdmin && <span className="rounded-full border border-roxo/40 bg-roxo/10 px-2 py-0.5 text-[10px] uppercase text-roxo-light">Superadmin</span>}
                    {u.excluido && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase text-red-300">Excluída</span>}
                    {!u.excluido && u.status === "bloqueado" && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase text-red-300">Bloqueado</span>}
                    {u.trocaSenhaObrigatoria && <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase text-yellow-200/90">Troca pendente</span>}
                  </div>
                  <div className="truncate text-xs text-gelo-dim">{u.username}{u.email ? ` · ${u.email}` : ""} · último acesso: {u.ultimoAcessoLabel ?? "—"}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {u.excluido ? (
                  <button onClick={() => { if (window.confirm(`Restaurar a conta de ${u.nome}?`)) acao(() => { const fd = new FormData(); fd.set("id", String(u.id)); return restaurarUsuario(fd); }, "Conta restaurada."); }} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-ink px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"><RotateCcw className="h-3.5 w-3.5" /> Restaurar</button>
                ) : (
                  <>
                    <button onClick={() => setEditar(u)} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-xs text-gelo-dim hover:text-gelo"><Pencil className="h-3.5 w-3.5" /> Editar</button>
                    <button onClick={() => setLogin(u)} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-xs text-gelo-dim hover:text-gelo"><AtSign className="h-3.5 w-3.5" /> Login</button>
                    <button onClick={() => setReset(u)} className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-2.5 py-1.5 text-xs text-gelo-dim hover:text-gelo"><KeyRound className="h-3.5 w-3.5" /> Redefinir senha</button>
                    {u.protegido ? (
                      <span className="flex items-center gap-1.5 rounded-lg border border-roxo/30 bg-roxo/5 px-2.5 py-1.5 text-xs text-roxo-light/80"><ShieldAlert className="h-3.5 w-3.5" /> Conta protegida</span>
                    ) : (
                      <>
                        {u.status === "bloqueado" ? (
                          <button onClick={() => acao(() => { const fd = new FormData(); fd.set("id", String(u.id)); fd.set("bloquear", "false"); return definirStatusUsuario(fd); }, "Usuário reativado.")} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-ink px-2.5 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"><CircleCheck className="h-3.5 w-3.5" /> Reativar</button>
                        ) : (
                          <button onClick={() => { if (window.confirm(`Bloquear ${u.nome}? Ele não conseguirá mais entrar.`)) acao(() => { const fd = new FormData(); fd.set("id", String(u.id)); fd.set("bloquear", "true"); return definirStatusUsuario(fd); }, "Usuário bloqueado."); }} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-ink px-2.5 py-1.5 text-xs text-red-300/80 hover:bg-red-500/10"><Ban className="h-3.5 w-3.5" /> Bloquear</button>
                        )}
                        <button onClick={() => setExcluir(u)} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-ink px-2.5 py-1.5 text-xs text-red-300/80 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
                      </>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
          {filtrados.length === 0 && <li className="py-6 text-center text-sm text-gelo-dim">Nenhum usuário encontrado.</li>}
        </ul>
      </div>

      {novo && <NovoUsuarioModal cargos={cargos} onClose={() => setNovo(false)} onSalvar={(fd) => acao(() => criarUsuario(fd), "Usuário criado.", () => setNovo(false))} />}
      {editar && <EditarModal usuario={editar} onClose={() => setEditar(null)} onSalvar={(fd) => acao(() => editarUsuario(fd), "Usuário atualizado.", () => setEditar(null))} />}
      {reset && <ResetModal usuario={reset} onClose={() => setReset(null)} onSalvar={(fd) => acao(() => redefinirSenhaUsuario(fd), "Senha redefinida.", () => setReset(null))} />}
      {login && <LoginModal usuario={login} onClose={() => setLogin(null)} onSalvar={(fd) => acao(() => alterarLoginUsuario(fd), "Login alterado. O usuário deve entrar com o novo login.", () => setLogin(null))} />}
      {excluir && <DeleteModal usuario={excluir} onClose={() => setExcluir(null)} onConfirmar={(fd) => acao(() => excluirUsuario(fd), "Conta excluída (histórico preservado).", () => setExcluir(null))} />}
    </div>
  );
}

function LoginModal({ usuario, onClose, onSalvar }: { usuario: UsuarioAdmin; onClose: () => void; onSalvar: (fd: FormData) => void }) {
  const [novo, setNovo] = useState(usuario.username);
  function salvar() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("novoLogin", novo);
    onSalvar(fd);
  }
  return (
    <ModalBase titulo={`Alterar login — ${usuario.username}`} onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <label className="flex flex-col gap-1"><span className={lbl}>Novo login</span><input value={novo} onChange={(e) => setNovo(e.target.value.toLowerCase())} className={inputCls} /></label>
        <p className="text-[11px] text-gelo-dim/60">Só superadministradores podem alterar login. O usuário precisará entrar com o novo login no próximo acesso.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={salvar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Salvar login</button>
      </div>
    </ModalBase>
  );
}

function DeleteModal({ usuario, onClose, onConfirmar }: { usuario: UsuarioAdmin; onClose: () => void; onConfirmar: (fd: FormData) => void }) {
  const [motivo, setMotivo] = useState("");
  const [confirm, setConfirm] = useState("");
  const podeExcluir = confirm.trim().toLowerCase() === usuario.username.toLowerCase();
  function excluir() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("motivo", motivo);
    fd.set("confirmLogin", confirm);
    onConfirmar(fd);
  }
  return (
    <ModalBase titulo="Excluir conta" onClose={onClose}>
      <div className="flex flex-col gap-3 p-5">
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200/90">
          Você vai excluir <strong className="text-gelo">{usuario.nome}</strong> ({usuario.username}). A conta deixa de logar e some das novas atribuições, mas o histórico de trabalho é preservado (exclusão lógica).
        </div>
        <label className="flex flex-col gap-1"><span className={lbl}>Motivo (opcional)</span><input value={motivo} onChange={(e) => setMotivo(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Digite o login <strong className="text-gelo">{usuario.username}</strong> para confirmar</span><input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} placeholder={usuario.username} /></label>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={excluir} disabled={!podeExcluir} className="rounded-lg bg-red-600/80 px-5 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40">Excluir conta</button>
      </div>
    </ModalBase>
  );
}

function ModalBase({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-lg rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <h3 className="font-display text-lg uppercase text-gelo">{titulo}</h3>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function NovoUsuarioModal({ cargos, onClose, onSalvar }: { cargos: CargoView[]; onClose: () => void; onSalvar: (fd: FormData) => void }) {
  const [username, setUsername] = useState("");
  const [usernameEditadoManual, setUsernameEditadoManual] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [trocar, setTrocar] = useState(true);
  const [sel, setSel] = useState<number[]>([]);
  const [copiado, setCopiado] = useState(false);

  // Sugere o login (nome@boechat.com) ao sair do campo nome — só se o
  // superadmin ainda não tiver editado o login manualmente.
  async function sugerirLogin() {
    if (usernameEditadoManual || !nome.trim()) return;
    const sugestao = await gerarLoginUnico(nome);
    setUsername(sugestao);
  }

  async function gerar() {
    const s = await gerarSenhaTemporaria();
    setSenha(s);
  }
  function copiar() {
    navigator.clipboard.writeText(senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }
  function salvar() {
    const fd = new FormData();
    fd.set("username", username);
    fd.set("nome", nome);
    fd.set("email", email);
    fd.set("senha", senha);
    fd.set("trocar", String(trocar));
    fd.set("cargos", sel.join(","));
    onSalvar(fd);
  }

  return (
    <ModalBase titulo="Novo usuário" onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1"><span className={lbl}>Nome completo</span><input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={sugerirLogin} className={inputCls} /></label>
          <label className="flex flex-col gap-1">
            <span className={lbl}>Login (gerado automaticamente, editável)</span>
            <input value={username} onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameEditadoManual(true); }} placeholder="gerado a partir do nome" className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1"><span className={lbl}>E-mail</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} /></label>

        <div className="flex flex-col gap-1">
          <span className={lbl}>Senha temporária</span>
          <div className="flex gap-2">
            <div className="flex-1"><CampoSenha valor={senha} onChange={setSenha} placeholder="mín. 8, letra + número" /></div>
            <button type="button" onClick={gerar} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo"><Wand2 className="h-3.5 w-3.5" /> Gerar</button>
            <button type="button" onClick={copiar} disabled={!senha} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo disabled:opacity-40"><Copy className="h-3.5 w-3.5" /> {copiado ? "Copiado" : "Copiar"}</button>
          </div>
          <span className="text-[11px] text-gelo-dim/60">Copie e entregue ao usuário. Depois de criar, ela não é exibida de novo.</span>
        </div>

        <label className="flex items-center gap-2 text-sm text-gelo-dim">
          <input type="checkbox" checked={trocar} onChange={(e) => setTrocar(e.target.checked)} /> Exigir troca de senha no primeiro acesso
        </label>

        {cargos.filter((c) => c.ativo).length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={lbl}>Cargos</span>
            <div className="flex flex-wrap gap-2">
              {cargos.filter((c) => c.ativo).map((c) => {
                const on = sel.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => setSel((p) => on ? p.filter((x) => x !== c.id) : [...p, c.id])} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${on ? "border-roxo-light bg-roxo/20 text-gelo" : "border-ink-line text-gelo-dim"}`}>
                    <span className="h-2 w-2 rounded-full" style={{ background: c.cor }} /> {c.nome}
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] text-gelo-dim/50">Cargo é função profissional. Não concede acesso sensível sozinho.</span>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={salvar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Criar usuário</button>
      </div>
    </ModalBase>
  );
}

function EditarModal({ usuario, onClose, onSalvar }: { usuario: UsuarioAdmin; onClose: () => void; onSalvar: (fd: FormData) => void }) {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  function salvar() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("nome", nome);
    fd.set("email", email);
    onSalvar(fd);
  }
  return (
    <ModalBase titulo={`Editar ${usuario.username}`} onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <label className="flex flex-col gap-1"><span className={lbl}>Nome completo</span><input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} /></label>
        <label className="flex flex-col gap-1"><span className={lbl}>E-mail</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} /></label>
        <p className="text-[11px] text-gelo-dim/50">Cargos e superadmin são geridos na aba “Cargos e permissões”.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={salvar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Salvar</button>
      </div>
    </ModalBase>
  );
}

function ResetModal({ usuario, onClose, onSalvar }: { usuario: UsuarioAdmin; onClose: () => void; onSalvar: (fd: FormData) => void }) {
  const [senha, setSenha] = useState("");
  const [trocar, setTrocar] = useState(true);
  const [copiado, setCopiado] = useState(false);
  async function gerar() { setSenha(await gerarSenhaTemporaria()); }
  function copiar() { navigator.clipboard.writeText(senha); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
  function salvar() {
    const fd = new FormData();
    fd.set("id", String(usuario.id));
    fd.set("senha", senha);
    fd.set("trocar", String(trocar));
    onSalvar(fd);
  }
  return (
    <ModalBase titulo={`Redefinir senha — ${usuario.username}`} onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <span className={lbl}>Nova senha temporária</span>
          <div className="flex gap-2">
            <div className="flex-1"><CampoSenha valor={senha} onChange={setSenha} placeholder="mín. 8, letra + número" /></div>
            <button type="button" onClick={gerar} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo"><Wand2 className="h-3.5 w-3.5" /> Gerar</button>
            <button type="button" onClick={copiar} disabled={!senha} className="flex items-center gap-1.5 rounded-xl border border-ink-line bg-ink px-3 text-xs text-gelo-dim hover:text-gelo disabled:opacity-40"><Copy className="h-3.5 w-3.5" /> {copiado ? "Copiado" : "Copiar"}</button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gelo-dim"><input type="checkbox" checked={trocar} onChange={(e) => setTrocar(e.target.checked)} /> Exigir troca no próximo acesso</label>
        <p className="text-[11px] text-gelo-dim/50">A senha atual do usuário nunca é exibida. Entregue a nova de forma segura.</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onClose} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo">Cancelar</button>
        <button onClick={salvar} className="rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90">Redefinir</button>
      </div>
    </ModalBase>
  );
}
