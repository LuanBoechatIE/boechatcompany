"use client";

import { useState } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Reveal } from "../components/Reveal";
import { Magnetic } from "../components/Magnetic";
import { whatsappLink } from "../lib/contato";

type Field = {
  key: string;
  label: string;
  placeholder: string;
  type: "input" | "textarea";
};

const fields: Field[] = [
  { key: "negocio", label: "Nome do negócio", placeholder: "Ex.: Clínica Lumière", type: "input" },
  { key: "responsavel", label: "Seu nome", placeholder: "Quem está preenchendo", type: "input" },
  { key: "servicos", label: "Serviços / diferenciais", placeholder: "3 a 6 principais, o que vocês mais querem destacar", type: "textarea" },
  { key: "sobre", label: "Sobre o negócio", placeholder: "Um parágrafo: história, o que torna vocês diferentes", type: "textarea" },
  { key: "horario", label: "Horário de funcionamento", placeholder: "Ex.: Seg a Sex, 9h às 19h", type: "input" },
  { key: "endereco", label: "Endereço", placeholder: "Endereço completo, se atender presencial", type: "input" },
  { key: "contato", label: "Contatos", placeholder: "WhatsApp, telefone, Instagram, outras redes", type: "textarea" },
  { key: "cor", label: "Preferência de cor (opcional)", placeholder: "Se já tiver uma cor/identidade definida", type: "input" },
  { key: "dominio", label: "Domínio", placeholder: "Já tem um domínio? Qual? Ou quer que a gente registre um", type: "input" },
];

export default function Intake() {
  const [values, setValues] = useState<Record<string, string>>({});

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const isComplete = fields
    .filter((f) => f.key !== "cor" && f.key !== "dominio")
    .every((f) => values[f.key]?.trim());

  const buildMessage = () => {
    const lines = fields
      .filter((f) => values[f.key]?.trim())
      .map((f) => `${f.label}: ${values[f.key]}`);
    return [
      "Intake pra montar o site:",
      ...lines,
      "",
      "Vou te mandar o logo e as fotos aqui no WhatsApp em seguida.",
    ].join("\n");
  };

  const href = whatsappLink(buildMessage());

  return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="border-t border-ink-line/60 py-28 sm:py-40">
          <div className="mx-auto max-w-3xl px-6">
            <Reveal>
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-roxo-light">
                Intake
              </span>
              <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.6rem)] uppercase leading-[0.98] text-balance">
                Manda tudo de uma vez
                <span className="text-roxo">.</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gelo-dim">
                Preenche os campos abaixo. No final, isso vira uma mensagem
                pronta no WhatsApp. Manda o logo e as fotos direto por lá, em
                seguida.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-12 flex flex-col gap-6">
                {fields.map((f) => (
                  <label key={f.key} className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-gelo-dim">
                      {f.label}
                    </span>
                    {f.type === "textarea" ? (
                      <textarea
                        value={values[f.key] ?? ""}
                        onChange={update(f.key)}
                        placeholder={f.placeholder}
                        rows={3}
                        className="rounded-2xl border border-ink-line bg-ink-soft/40 p-4 text-base text-gelo placeholder:text-gelo-dim/50 outline-none focus:border-roxo-light/60"
                      />
                    ) : (
                      <input
                        value={values[f.key] ?? ""}
                        onChange={update(f.key)}
                        placeholder={f.placeholder}
                        className="rounded-2xl border border-ink-line bg-ink-soft/40 p-4 text-base text-gelo placeholder:text-gelo-dim/50 outline-none focus:border-roxo-light/60"
                      />
                    )}
                  </label>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-10">
                <Magnetic className="inline-block">
                  <a
                    href={isComplete ? href : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!isComplete}
                    onClick={(e) => {
                      if (!isComplete) e.preventDefault();
                    }}
                    className={`group inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-medium text-white shadow-[0_8px_40px_-12px_rgba(109,40,217,0.6)] transition-shadow duration-300 ${
                      isComplete
                        ? "bg-roxo hover:shadow-[0_12px_60px_-12px_rgba(109,40,217,0.85)]"
                        : "bg-roxo/30 cursor-not-allowed"
                    }`}
                  >
                    Enviar pelo WhatsApp
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </Magnetic>
                {!isComplete && (
                  <p className="mt-3 text-sm text-gelo-dim">
                    Preenche os campos obrigatórios pra liberar o envio.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
