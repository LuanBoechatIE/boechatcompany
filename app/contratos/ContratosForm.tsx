"use client";

import { useMemo, useState } from "react";
import { Printer, Scale, TriangleAlert } from "lucide-react";
import {
  buildContrato,
  CONTRATADA,
  type ContratoData,
  type FormaPagamento,
  type ManutencaoTipo,
} from "../lib/contrato-template";

const FORMAS: FormaPagamento[] = [
  "À vista, via PIX, no aceite deste contrato",
  "50% (cinquenta por cento) no aceite e 50% (cinquenta por cento) na entrega",
];

export function ContratosForm() {
  const [d, setD] = useState<ContratoData>({
    tipoPessoa: "PJ",
    contratanteNome: "",
    contratanteDoc: "",
    contratanteEndereco: "",
    representanteNome: "",
    representanteCpf: "",
    contratanteEmail: "",
    valorSite: "",
    formaPagamento: FORMAS[0],
    manutencaoTipo: "mensal",
    manutencaoValor: "100,00",
    cidadeForo: "São Paulo/SP",
    data: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  });
  const [gerado, setGerado] = useState(false);

  const set =
    <K extends keyof ContratoData>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setD((p) => ({ ...p, [k]: e.target.value as ContratoData[K] }));

  const contrato = useMemo(() => buildContrato(d), [d]);

  const dadosBoechatPendentes = CONTRATADA.nome.startsWith("[");

  const inputCls =
    "rounded-xl border border-ink-line bg-ink p-3 text-base outline-none focus:border-roxo-light/60";

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .contrato-doc { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
          body { background: #fff !important; }
        }
        @page { size: A4; margin: 20mm; }
      `}</style>

      <div className="no-print mb-8">
        <h1 className="font-display text-3xl uppercase">Contratos</h1>
        <p className="mt-1 text-sm text-gelo-dim">
          Gera o contrato de site + manutenção e prepara pra assinatura no Autentique.
        </p>
      </div>

      {dadosBoechatPendentes && (
        <div className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200/90">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Os dados da Boechat (CONTRATADA) ainda estão como placeholder. Preencha
            em <code>app/lib/contrato-template.ts</code> (constante CONTRATADA) antes de
            gerar um contrato pra valer.
          </span>
        </div>
      )}

      <div className="no-print mb-6 flex items-start gap-3 rounded-2xl border border-ink-line bg-ink-soft/40 p-4 text-sm text-gelo-dim">
        <Scale className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Template estruturado no padrão de mercado. Antes de assinar com cliente,
          revise uma vez com um advogado. Depois de gerar, salve em PDF e suba no
          Autentique pra coletar as assinaturas.
        </span>
      </div>

      <div className="no-print grid gap-8 lg:grid-cols-[1fr_1fr]">
        {/* FORM */}
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-medium">Dados do contrato</h2>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Tipo de cliente</span>
            <select value={d.tipoPessoa} onChange={set("tipoPessoa")} className={inputCls}>
              <option value="PJ">Pessoa Jurídica (CNPJ)</option>
              <option value="PF">Pessoa Física (CPF)</option>
            </select>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">
              {d.tipoPessoa === "PJ" ? "Razão social" : "Nome completo"}
            </span>
            <input value={d.contratanteNome} onChange={set("contratanteNome")} className={inputCls} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">
              {d.tipoPessoa === "PJ" ? "CNPJ" : "CPF"}
            </span>
            <input value={d.contratanteDoc} onChange={set("contratanteDoc")} className={inputCls} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Endereço completo</span>
            <input value={d.contratanteEndereco} onChange={set("contratanteEndereco")} className={inputCls} />
          </label>

          {d.tipoPessoa === "PJ" && (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-gelo-dim">Representante legal</span>
                <input value={d.representanteNome} onChange={set("representanteNome")} className={inputCls} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-gelo-dim">CPF do representante</span>
                <input value={d.representanteCpf} onChange={set("representanteCpf")} className={inputCls} />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">E-mail do cliente (pro Autentique)</span>
            <input value={d.contratanteEmail} onChange={set("contratanteEmail")} className={inputCls} />
          </label>

          <hr className="border-ink-line" />

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Valor do site (R$)</span>
            <input value={d.valorSite} onChange={set("valorSite")} placeholder="1.250,00" className={inputCls} />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-gelo-dim">Forma de pagamento</span>
            <select value={d.formaPagamento} onChange={set("formaPagamento")} className={inputCls}>
              {FORMAS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gelo-dim">Manutenção</span>
              <select
                value={d.manutencaoTipo}
                onChange={(e) => {
                  const tipo = e.target.value as ManutencaoTipo;
                  setD((p) => ({
                    ...p,
                    manutencaoTipo: tipo,
                    manutencaoValor: tipo === "mensal" ? "100,00" : "500,00",
                  }));
                }}
                className={inputCls}
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual (à vista)</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gelo-dim">Valor manutenção (R$)</span>
              <input value={d.manutencaoValor} onChange={set("manutencaoValor")} className={inputCls} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gelo-dim">Foro (cidade/UF)</span>
              <input value={d.cidadeForo} onChange={set("cidadeForo")} className={inputCls} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-gelo-dim">Data</span>
              <input value={d.data} onChange={set("data")} className={inputCls} />
            </label>
          </div>

          <button
            onClick={() => setGerado(true)}
            className="mt-2 rounded-full bg-roxo px-6 py-3 text-base font-medium text-white"
          >
            Gerar contrato
          </button>
        </div>

        {/* DICA */}
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-6 text-sm leading-relaxed text-gelo-dim">
          <p className="font-medium text-gelo">Como usar</p>
          <ol className="mt-3 list-decimal space-y-2 pl-4">
            <li>Preenche os dados do cliente e do negócio.</li>
            <li>Clica em <strong>Gerar contrato</strong>: o documento aparece abaixo.</li>
            <li>Clica em <strong>Imprimir / Salvar PDF</strong> e salva como PDF.</li>
            <li>Sobe o PDF no Autentique e adiciona os signatários (você + cliente) pra coletar as assinaturas.</li>
          </ol>
        </div>
      </div>

      {/* DOCUMENTO */}
      {gerado && (
        <>
          <div className="no-print mt-10 flex justify-center">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-roxo px-8 py-3 text-base font-medium text-white"
            >
              <Printer className="h-4 w-4" />
              Imprimir / Salvar PDF
            </button>
          </div>

          <article className="contrato-doc mx-auto mt-8 max-w-3xl rounded-sm bg-white p-12 text-[13px] leading-relaxed text-black shadow-lg">
            <h1 className="text-center text-base font-bold uppercase">{contrato.titulo}</h1>
            <p className="mt-6 text-justify">{contrato.preambulo}</p>

            {contrato.clausulas.map((c) => (
              <section key={c.titulo} className="mt-5">
                <h2 className="text-[13px] font-bold">{c.titulo}</h2>
                {c.itens.map((it, i) => (
                  <p key={i} className="mt-1 text-justify">{it}</p>
                ))}
              </section>
            ))}

            <p className="mt-6 text-justify">{contrato.fecho}</p>
            <p className="mt-6">{contrato.local}</p>

            <div className="mt-16 grid grid-cols-2 gap-10">
              {contrato.assinaturas.map((nome, i) => (
                <div key={i} className="text-center">
                  <div className="border-t border-black pt-2 text-[12px]">{nome}</div>
                  <div className="text-[11px] text-neutral-600">
                    {i === 0 ? "CONTRATADA" : "CONTRATANTE"}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </>
      )}
    </>
  );
}
