"use client";

// Campo dinâmico de formulário (renderiza um FieldDef) + widget de upload
// pro Blob. Extraído do onboarding pra ser compartilhado com o módulo de
// Recrutamento (candidatura de vaga) — os dois usam a MESMA estrutura de
// campo, só a rota de upload e o token mudam.
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import type { FieldDef } from "@/app/lib/onboarding/types";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

// Precisa bater com o MAX_BYTES de cada rota de upload que usar este campo.
export const TAMANHO_MAX_MB = 24;
const TAMANHO_MAX_BYTES = TAMANHO_MAX_MB * 1024 * 1024;

// Se ficar mais que isso sem nenhum progresso, considera travado e cancela.
const SEM_PROGRESSO_TIMEOUT_MS = 40_000;

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

function mensagemDeErro(e: unknown): string {
  if (isAbortError(e)) {
    return "conexão travou (sem progresso por muito tempo), tenta de novo";
  }
  const msg = e instanceof Error ? e.message : "";
  return msg || "não deu pra enviar, tenta de novo";
}

function nomeDoUrl(url: string): string {
  try {
    const raw = decodeURIComponent(url.split("/").pop() ?? url);
    return raw.replace(/-[a-z0-9]{20,}(\.[a-z0-9]+)?$/i, "$1"); // tira o sufixo aleatório
  } catch {
    return url;
  }
}

// Campo de upload. Cada arquivo vai direto pro Blob via `uploadUrl` (a rota
// valida o `uploadToken` como clientPayload). As URLs ficam num input
// escondido (separadas por \n) pro submit levar junto.
function ArquivoCampo({
  campo,
  uploadUrl,
  uploadToken,
  valorInicial,
}: {
  campo: FieldDef;
  uploadUrl: string;
  uploadToken: string;
  valorInicial: string;
}) {
  const name = `campo_${campo.id}`;
  const req = campo.obrigatorio;
  const [arquivos, setArquivos] = useState<{ url: string; nome: string }[]>(
    valorInicial
      ? valorInicial
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
          .map((u) => ({ url: u, nome: nomeDoUrl(u) }))
      : [],
  );
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState<{ nome: string; pct: number } | null>(null);
  const [erro, setErro] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setEnviando(true);
    setErro("");

    const falhas: string[] = [];
    for (const file of files) {
      if (file.size > TAMANHO_MAX_BYTES) {
        falhas.push(
          `${file.name} (mais de ${TAMANHO_MAX_MB}MB, manda uma versão menor ou envia pelo WhatsApp)`,
        );
        continue;
      }

      const controller = new AbortController();
      let watchdog: ReturnType<typeof setTimeout> | undefined;
      const armarWatchdog = () => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => controller.abort(), SEM_PROGRESSO_TIMEOUT_MS);
      };
      armarWatchdog();
      setProgresso({ nome: file.name, pct: 0 });

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: uploadUrl,
          clientPayload: uploadToken,
          abortSignal: controller.signal,
          onUploadProgress: (p) => {
            armarWatchdog();
            setProgresso({ nome: file.name, pct: Math.round(p.percentage) });
          },
        });
        // Salva assim que sobe: se outro arquivo da leva falhar, este permanece.
        setArquivos((a) => [...a, { url: blob.url, nome: file.name }]);
      } catch (err) {
        falhas.push(`${file.name} (${mensagemDeErro(err)})`);
      } finally {
        clearTimeout(watchdog);
      }
    }

    setProgresso(null);
    setErro(falhas.length > 0 ? `Não deu pra enviar: ${falhas.join("; ")}` : "");
    setEnviando(false);
    e.target.value = "";
  }

  function remover(url: string) {
    setArquivos((a) => a.filter((x) => x.url !== url));
  }

  const valor = arquivos.map((a) => a.url).join("\n");

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gelo">
        {campo.label}
        {req && <span className="text-roxo-light"> *</span>}
      </span>
      {campo.ajuda && <span className="-mt-1 text-xs text-gelo-dim">{campo.ajuda}</span>}

      <input type="hidden" name={name} value={valor} />

      <input
        type="file"
        multiple
        onChange={onPick}
        disabled={enviando}
        className="w-full rounded-xl border border-dashed border-ink-line bg-ink p-3 text-sm text-gelo-dim file:mr-3 file:rounded-lg file:border-0 file:bg-roxo file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90 disabled:opacity-50"
      />

      <span className="text-xs text-gelo-dim">
        Até {TAMANHO_MAX_MB}MB por arquivo. Maior que isso, manda pelo WhatsApp.
      </span>

      {enviando && (
        <span className="text-xs text-roxo-light">
          {progresso
            ? `Enviando ${progresso.nome}... ${progresso.pct}%`
            : "Enviando arquivo..."}
        </span>
      )}
      {erro && <span className="text-xs text-red-300">{erro}</span>}

      {arquivos.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {arquivos.map((a) => (
            <li
              key={a.url}
              className="flex items-center justify-between gap-3 rounded-lg border border-ink-line bg-ink-soft/40 px-3 py-2 text-sm"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-gelo hover:text-roxo-light"
              >
                {a.nome}
              </a>
              <button
                type="button"
                onClick={() => remover(a.url)}
                className="shrink-0 text-xs text-red-300/70 hover:text-red-300"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

export function Campo({
  campo,
  valor,
  uploadUrl,
  uploadToken,
}: {
  campo: FieldDef;
  valor: string;
  uploadUrl: string;
  uploadToken: string;
}) {
  const name = `campo_${campo.id}`;
  const req = campo.obrigatorio;

  if (campo.tipo === "arquivo") {
    return <ArquivoCampo campo={campo} uploadUrl={uploadUrl} uploadToken={uploadToken} valorInicial={valor} />;
  }

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gelo">
        {campo.label}
        {req && <span className="text-roxo-light"> *</span>}
      </span>
      {campo.ajuda && <span className="-mt-1 text-xs text-gelo-dim">{campo.ajuda}</span>}

      {campo.tipo === "textarea" ? (
        <textarea name={name} defaultValue={valor} rows={4} className={inputCls} />
      ) : campo.tipo === "select" ? (
        <select name={name} defaultValue={valor} className={inputCls}>
          <option value="">Selecione</option>
          {(campo.opcoes ?? []).map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      ) : campo.tipo === "sim_nao" ? (
        <div className="flex gap-6 pt-1">
          {[
            ["sim", "Sim"],
            ["nao", "Não"],
          ].map(([v, label]) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gelo">
              <input
                type="radio"
                name={name}
                value={v}
                defaultChecked={valor === v}
                className="h-4 w-4 accent-[var(--color-roxo)]"
              />
              {label}
            </label>
          ))}
        </div>
      ) : (
        <input
          type={
            campo.tipo === "numero"
              ? "number"
              : campo.tipo === "data"
                ? "date"
                : campo.tipo === "link"
                  ? "url"
                  : "text"
          }
          name={name}
          defaultValue={valor}
          placeholder={campo.tipo === "link" ? "https://..." : undefined}
          className={inputCls}
        />
      )}
    </label>
  );
}

export { inputCls };
