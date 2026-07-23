"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  User,
  Shield,
  ShieldCheck,
  UsersRound,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ImageUp,
  Loader2,
  Check,
  X,
} from "lucide-react";
import {
  atualizarMeuPerfil,
  atualizarPreferencias,
  alterarMinhaSenha,
  type PerfilView,
} from "@/app/admin/perfil-actions";
import { CargosPermissoes } from "./CargosPermissoes";
import { AdminContas } from "./AdminContas";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";
const cardCls = "rounded-2xl border border-ink-line bg-ink-soft/30 p-5";

type Aba = "perfil" | "seguranca" | "preferencias" | "cargos" | "contas";
const ABAS_BASE: { key: Aba; label: string; icon: typeof User }[] = [
  { key: "perfil", label: "Meu perfil", icon: User },
  { key: "seguranca", label: "Segurança", icon: Shield },
  { key: "preferencias", label: "Preferências", icon: SlidersHorizontal },
];
const ABAS_ADMIN: { key: Aba; label: string; icon: typeof User }[] = [
  { key: "contas", label: "Administração de contas", icon: UsersRound },
  { key: "cargos", label: "Cargos e permissões", icon: ShieldCheck },
];

function iniciais(n: string) {
  return n.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

function Toast({ msg, erro }: { msg: string; erro?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-2.5 text-sm ${erro ? "border-red-500/30 bg-red-500/5 text-red-200/90" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90"}`}>
      {msg}
    </div>
  );
}

export function ConfiguracoesTabs({ perfil }: { perfil: PerfilView }) {
  const [aba, setAba] = useState<Aba>(perfil.trocaSenhaObrigatoria ? "seguranca" : "perfil");
  const abas = perfil.superAdmin ? [...ABAS_BASE, ...ABAS_ADMIN] : ABAS_BASE;

  return (
    <div className="flex flex-col gap-6">
      {perfil.trocaSenhaObrigatoria && (
        <div className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5 text-sm text-yellow-100/90">
          <Shield className="h-4 w-4 text-yellow-300" />
          Troca de senha pendente. Defina uma nova senha na aba <strong className="text-gelo">Segurança</strong>.
        </div>
      )}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-line">
        {abas.map((a) => {
          const on = a.key === aba;
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors ${on ? "border-roxo-light font-medium text-gelo" : "border-transparent text-gelo-dim hover:text-gelo"}`}
            >
              <Icon className="h-4 w-4" /> {a.label}
            </button>
          );
        })}
      </div>

      {aba === "perfil" && <MeuPerfil perfil={perfil} />}
      {aba === "seguranca" && <Seguranca />}
      {aba === "preferencias" && <Preferencias perfil={perfil} />}
      {aba === "contas" && perfil.superAdmin && <AdminContas />}
      {aba === "cargos" && perfil.superAdmin && <CargosPermissoes />}
    </div>
  );
}

function MeuPerfil({ perfil }: { perfil: PerfilView }) {
  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [foto, setFoto] = useState(perfil.foto);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);

  async function enviarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setToast({ msg: "Use PNG, JPG ou WebP.", erro: true });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ msg: "Arquivo acima de 5 MB.", erro: true });
      return;
    }
    setEnviando(true);
    try {
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/admin/api/upload-logo" });
      setFoto(blob.url);
    } catch {
      setToast({ msg: "Falha no upload.", erro: true });
    } finally {
      setEnviando(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    const fd = new FormData();
    fd.set("nome", nome);
    fd.set("email", email);
    fd.set("foto", foto);
    const r = await atualizarMeuPerfil(fd);
    setSalvando(false);
    setToast({ msg: r.ok ? "Perfil atualizado." : r.erro ?? "Falha.", erro: !r.ok });
  }

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} erro={toast.erro} />}

      <div className={cardCls}>
        <div className="flex flex-wrap items-center gap-5">
          {foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={foto} alt={nome} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-roxo/20 text-xl font-medium text-roxo-light">{iniciais(nome) || "?"}</span>
          )}
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:text-gelo">
              {enviando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />}
              {foto ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={enviarFoto} className="hidden" />
            </label>
            {foto && <button onClick={() => setFoto("")} className="text-left text-[11px] text-red-300/80 hover:text-red-300">Remover foto</button>}
            <span className="text-[11px] text-gelo-dim/60">PNG, JPG ou WebP, até 5 MB.</span>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={lbl}>Nome completo</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lbl}>E-mail</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputCls} />
          </label>
          <Info label="Login" valor={perfil.username} />
          <Info label="Status" valor={perfil.status === "bloqueado" ? "Bloqueado" : "Ativo"} />
          <Info label="Criado em" valor={perfil.criadoEmLabel} />
          <Info label="Último acesso" valor={perfil.ultimoAcessoLabel ?? "—"} />
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <span className={lbl}>Cargos</span>
          <div className="flex flex-wrap gap-2">
            {perfil.cargos.length ? perfil.cargos.map((c) => (
              <span key={c.label} className="rounded-full border border-ink-line bg-ink px-3 py-1 text-xs text-gelo-dim">{c.label}</span>
            )) : <span className="text-xs text-gelo-dim/60">Nenhum cargo definido. Um administrador gerencia os cargos.</span>}
          </div>
          <span className="text-[11px] text-gelo-dim/50">Cargos e permissões só podem ser alterados por um administrador.</span>
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar perfil"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={lbl}>{label}</span>
      <div className="rounded-xl border border-ink-line/60 bg-ink/50 p-2.5 text-sm text-gelo-dim">{valor}</div>
    </div>
  );
}

function CampoSenha({ label, valor, onChange }: { label: string; valor: string; onChange: (v: string) => void }) {
  const [ver, setVer] = useState(false);
  return (
    <label className="flex flex-col gap-1">
      <span className={lbl}>{label}</span>
      <div className="relative">
        <input
          type={ver ? "text" : "password"}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className={`${inputCls} pr-10`}
        />
        <button type="button" onClick={() => setVer((v) => !v)} className="absolute inset-y-0 right-2 flex items-center text-gelo-dim hover:text-gelo" aria-label={ver ? "Ocultar" : "Mostrar"}>
          {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

function Requisito({ ok, texto }: { ok: boolean; texto: string }) {
  return (
    <span className={`flex items-center gap-1.5 text-[11px] ${ok ? "text-emerald-300" : "text-gelo-dim/70"}`}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {texto}
    </span>
  );
}

function Seguranca() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);

  const temTam = nova.length >= 8;
  const temLetra = /[A-Za-z]/.test(nova);
  const temNum = /\d/.test(nova);
  const confere = nova.length > 0 && nova === confirmar;
  const podeSalvar = temTam && temLetra && temNum && confere && atual.length > 0;

  async function salvar() {
    setSalvando(true);
    const fd = new FormData();
    fd.set("senhaAtual", atual);
    fd.set("novaSenha", nova);
    fd.set("confirmarSenha", confirmar);
    const r = await alterarMinhaSenha(fd);
    setSalvando(false);
    setToast({ msg: r.ok ? "Senha alterada com sucesso." : r.erro ?? "Falha.", erro: !r.ok });
    if (r.ok) { setAtual(""); setNova(""); setConfirmar(""); }
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      {toast && <Toast msg={toast.msg} erro={toast.erro} />}
      <div className={cardCls}>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">Alterar senha</h3>
        <div className="flex flex-col gap-4">
          <CampoSenha label="Senha atual" valor={atual} onChange={setAtual} />
          <CampoSenha label="Nova senha" valor={nova} onChange={setNova} />
          <CampoSenha label="Confirmar nova senha" valor={confirmar} onChange={setConfirmar} />

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Requisito ok={temTam} texto="8+ caracteres" />
            <Requisito ok={temLetra} texto="uma letra" />
            <Requisito ok={temNum} texto="um número" />
            <Requisito ok={confere} texto="as senhas coincidem" />
          </div>

          <div className="flex justify-end">
            <button onClick={salvar} disabled={!podeSalvar || salvando} className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40">
              {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Alterando…</> : "Alterar senha"}
            </button>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gelo-dim/50">A senha é guardada com hash seguro (scrypt). O sistema nunca exibe sua senha atual.</p>
    </div>
  );
}

function Preferencias({ perfil }: { perfil: PerfilView }) {
  const [vista, setVista] = useState(perfil.preferencias?.calendarioVista ?? "mes");
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; erro?: boolean } | null>(null);

  async function salvar() {
    setSalvando(true);
    const fd = new FormData();
    fd.set("calendarioVista", vista);
    const r = await atualizarPreferencias(fd);
    setSalvando(false);
    setToast({ msg: r.ok ? "Preferências salvas." : r.erro ?? "Falha.", erro: !r.ok });
  }

  return (
    <div className="flex max-w-xl flex-col gap-5">
      {toast && <Toast msg={toast.msg} erro={toast.erro} />}
      <div className={cardCls}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={lbl}>Visão inicial do calendário</span>
            <select value={vista} onChange={(e) => setVista(e.target.value)} className={inputCls}>
              <option value="mes">Mês</option>
              <option value="agenda">Agenda</option>
            </select>
          </label>
          <Info label="Fuso horário" valor="America/Sao_Paulo" />
          <Info label="Idioma" valor="Português (Brasil)" />
        </div>
        <div className="mt-5 flex justify-end">
          <button onClick={salvar} disabled={salvando} className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando…</> : "Salvar preferências"}
          </button>
        </div>
      </div>
    </div>
  );
}
