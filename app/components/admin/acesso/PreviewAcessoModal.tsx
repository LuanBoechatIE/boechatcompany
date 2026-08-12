"use client";

import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { ModalBase } from "@/app/components/admin/ui/ModalBase";
import type { PreviewAcesso } from "@/app/lib/usuarios/provisionamento";

const inputCls = "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm text-gelo outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

// Componente único de prévia de acesso, compartilhado entre a contratação de
// candidatura (ContratarBotao) e a criação manual de usuário com envio de
// acesso (NovoUsuarioModal) — não duplica UI de preview entre os dois fluxos
// (Melhoria 1/2). O preview renderiza `preview.html`, o MESMO HTML que vai
// ser enviado pelo Resend (fonte única, gerada por templateBoasVindas no
// servidor) — não existe um "PreviewTemplate" separado do "EmailTemplate".
export function PreviewAcessoModal({
  preview,
  onVoltar,
  onConfirmar,
  pending,
  erro,
}: {
  preview: PreviewAcesso;
  onVoltar: () => void;
  onConfirmar: (edicao: { assunto: string; saudacaoCustom: string; textoComplementar: string }) => void;
  pending: boolean;
  erro?: string;
}) {
  const [assunto, setAssunto] = useState(preview.assunto);
  const [saudacaoCustom, setSaudacaoCustom] = useState("");
  const [textoComplementar, setTextoComplementar] = useState("");

  return (
    <ModalBase titulo="Prévia do acesso" onClose={onVoltar} size="2xl">
      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className={lbl}>Destinatário</span>
            <p className="text-sm text-gelo">{preview.nome}</p>
            <p className="text-xs text-gelo-dim">{preview.emailPessoal}{preview.cargoNome ? ` · ${preview.cargoNome}` : ""}</p>
          </div>
          <div>
            <span className={lbl}>Acesso que será criado</span>
            <p className="text-sm text-gelo">{preview.login}</p>
            <p className="text-xs text-gelo-dim">Senha provisória gerada. Só é exibida aqui e, se o e-mail falhar, na tela seguinte.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ink-line pt-4">
          <span className={lbl}>Editar conteúdo do e-mail (opcional)</span>
          <label className="flex flex-col gap-1"><span className={lbl}>Assunto</span><input value={assunto} onChange={(e) => setAssunto(e.target.value)} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Saudação</span><input value={saudacaoCustom} onChange={(e) => setSaudacaoCustom(e.target.value)} placeholder={`Bem-vindo(a), ${preview.nome}!`} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Texto complementar</span><textarea value={textoComplementar} onChange={(e) => setTextoComplementar(e.target.value)} rows={2} className={inputCls} /></label>
          <span className="text-[11px] text-gelo-dim/50">Login, senha, nome e link de acesso são preenchidos pelo sistema e não são editáveis aqui.</span>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-ink-line pt-4">
          <span className={lbl}><Eye className="mr-1 inline h-3 w-3" /> Como o e-mail vai chegar</span>
          <div className="overflow-hidden rounded-xl border border-ink-line bg-white">
            <iframe title="Prévia do e-mail de acesso" srcDoc={preview.html} className="h-64 w-full" sandbox="" />
          </div>
        </div>

        {erro && <p className="text-sm text-red-300">{erro}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-ink-line px-5 py-4">
        <button onClick={onVoltar} disabled={pending} className="rounded-lg border border-ink-line px-4 py-2 text-sm text-gelo-dim hover:text-gelo disabled:opacity-40">Voltar</button>
        <button
          onClick={() => onConfirmar({ assunto, saudacaoCustom, textoComplementar })}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-roxo px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirmar e enviar acesso
        </button>
      </div>
    </ModalBase>
  );
}
