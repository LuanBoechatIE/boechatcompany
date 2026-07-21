"use client";

import { useActionState, useState } from "react";
import { upload } from "@vercel/blob/client";
import { submitOnboarding, type SubmitState } from "./actions";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

const initial: SubmitState = { status: "idle" };

// Precisa bater com maximumSizeInBytes em app/onboarding/api/upload/route.ts.
const TAMANHO_MAX_MB = 25;
const TAMANHO_MAX_BYTES = TAMANHO_MAX_MB * 1024 * 1024;

function mensagemDeErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (msg) return msg;
  return "Não deu pra enviar. Tenta de novo, ou manda um arquivo menor.";
}

function nomeDoUrl(url: string): string {
  try {
    const raw = decodeURIComponent(url.split("/").pop() ?? url);
    return raw.replace(/-[a-z0-9]{20,}(\.[a-z0-9]+)?$/i, "$1"); // tira o sufixo aleatório
  } catch {
    return url;
  }
}

// Campo de upload real (Vercel Blob). Aceita vários arquivos.
// Guarda as URLs num input escondido (separadas por \n) pro submit levar junto.
function ArquivoCampo({
  campo,
  token,
  valorInicial,
}: {
  campo: FieldDef;
  token: string;
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
  const [erro, setErro] = useState("");

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setEnviando(true);
    setErro("");

    const falhas: string[] = [];
    for (const file of files) {
      if (file.size > TAMANHO_MAX_BYTES) {
        falhas.push(`${file.name} (mais de ${TAMANHO_MAX_MB}MB, comprime ou manda em partes)`);
        continue;
      }
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/onboarding/api/upload",
          clientPayload: token,
          multipart: true,
        });
        // Adiciona assim que sobe: se outro arquivo da leva falhar depois,
        // este já fica salvo e não some da lista.
        setArquivos((a) => [...a, { url: blob.url, nome: file.name }]);
      } catch (err) {
        falhas.push(`${file.name} (${mensagemDeErro(err)})`);
      }
    }

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

      {enviando && <span className="text-xs text-roxo-light">Enviando arquivo...</span>}
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
                📎 {a.nome}
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

function Campo({
  campo,
  valor,
  token,
}: {
  campo: FieldDef;
  valor: string;
  token: string;
}) {
  const name = `campo_${campo.id}`;
  const req = campo.obrigatorio;

  if (campo.tipo === "arquivo") {
    return <ArquivoCampo campo={campo} token={token} valorInicial={valor} />;
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

export function OnboardingForm({
  token,
  campos,
  valores,
}: {
  token: string;
  campos: FieldDef[];
  valores: RespostaValores;
}) {
  const [state, action, pending] = useActionState(submitOnboarding, initial);

  if (state.status === "ok") {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="font-display text-2xl uppercase text-gelo">Recebido!</div>
        <p className="mt-3 text-sm text-gelo-dim">
          Suas respostas foram enviadas. Já vamos começar a estruturar. Se
          faltar algo, a gente te chama. Pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="__token" value={token} />

      {campos.map((campo) => (
        <Campo
          key={campo.id}
          campo={campo}
          valor={valores[campo.id] ?? ""}
          token={token}
        />
      ))}

      {state.status === "erro" && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
          {state.msg}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-roxo px-8 py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
      >
        {pending ? "Enviando..." : "Enviar respostas"}
      </button>

      <p className="text-xs text-gelo-dim">
        Você envia uma vez. Se precisar corrigir algo depois, é só avisar a
        gente que reabrimos pra você.
      </p>
    </form>
  );
}
