"use client";

import { useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import { ImageUp, Loader2, Trash2 } from "lucide-react";
import { updateClienteLogo } from "@/app/admin/crm-actions";

const TIPOS_OK = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_MB = 4;

export function LogoUploader({
  clienteId,
  logoAtual,
}: {
  clienteId: number;
  logoAtual: string;
}) {
  const [logo, setLogo] = useState(logoAtual);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciarSalvar] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (!file) return;
    setErro(null);

    if (!TIPOS_OK.includes(file.type)) {
      setErro("Formato inválido. Use PNG, JPG, WebP ou SVG.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErro(`Arquivo acima de ${MAX_MB} MB.`);
      return;
    }

    setEnviando(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/admin/api/upload-logo",
      });
      setLogo(blob.url);
      salvar(blob.url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setEnviando(false);
    }
  }

  function salvar(url: string) {
    const fd = new FormData();
    fd.set("id", String(clienteId));
    fd.set("logo", url);
    iniciarSalvar(() => {
      updateClienteLogo(fd);
    });
  }

  function remover() {
    setLogo("");
    salvar("");
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
      <h4 className="mb-1 text-sm font-medium uppercase tracking-wide text-gelo">
        Logo do cliente
      </h4>
      <p className="mb-4 text-xs text-gelo-dim">
        Usada no cabeçalho do relatório de tráfego exportado. PNG, JPG, WebP ou
        SVG, até {MAX_MB} MB.
      </p>

      <div className="flex items-center gap-4">
        <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-ink-line bg-ink">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt="Logo do cliente"
              className="max-h-16 max-w-28 object-contain"
            />
          ) : (
            <span className="text-[11px] text-gelo-dim/60">Sem logo</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo disabled:opacity-50"
          >
            {enviando ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <ImageUp className="h-3.5 w-3.5" /> {logo ? "Trocar logo" : "Enviar logo"}
              </>
            )}
          </button>
          {logo && (
            <button
              type="button"
              onClick={remover}
              disabled={salvando}
              className="flex items-center gap-2 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover
            </button>
          )}
          {salvando && <span className="text-[11px] text-gelo-dim/70">Salvando…</span>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={selecionar}
        className="hidden"
      />
      {erro && <p className="mt-3 text-xs text-red-300">{erro}</p>}
    </div>
  );
}
