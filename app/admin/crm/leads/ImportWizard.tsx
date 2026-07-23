"use client";

import { useState } from "react";
import {
  X,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  CAMPOS_IMPORT,
  type CampoImportKey,
  type LeadImportRow,
  type DuplicadoInfo,
  type EstrategiaDuplicado,
  type ImportResumo,
} from "@/app/lib/crm/types";
import { checkLeadDuplicates, importLeads } from "../../crm-actions";

type Passo = "arquivo" | "mapeamento" | "revisao" | "resultado";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const SINONIMOS: Record<CampoImportKey, string[]> = {
  nome: ["nome", "name", "lead", "cliente", "contato"],
  empresa: ["empresa", "company", "negocio", "razao"],
  pessoaContato: ["pessoa", "responsavel contato", "contact"],
  telefone: ["telefone", "phone", "fone", "tel"],
  whatsapp: ["whatsapp", "whats", "celular", "zap"],
  email: ["email", "e-mail", "mail"],
  servico: ["servico", "service", "interesse", "produto"],
  origem: ["origem", "source", "canal", "fonte"],
  responsavel: ["responsavel", "owner", "dono", "atendente"],
  valorEstimado: ["valor", "value", "ticket", "orcamento"],
  tags: ["tag", "etiqueta", "label"],
  observacoes: ["observ", "obs", "nota", "note", "comentario"],
};

function autoMap(headers: string[]): Record<CampoImportKey, number> {
  const map = {} as Record<CampoImportKey, number>;
  for (const campo of CAMPOS_IMPORT) {
    const idx = headers.findIndex((h) => {
      const nh = norm(h);
      return SINONIMOS[campo.key].some((s) => nh.includes(norm(s)));
    });
    map[campo.key] = idx;
  }
  return map;
}

const inputCls =
  "rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-sm text-gelo-dim outline-none focus:border-roxo-light/50";

export function ImportWizard({ onClose }: { onClose: () => void }) {
  const [passo, setPasso] = useState<Passo>("arquivo");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<string[][]>([]);
  const [mapa, setMapa] = useState<Record<CampoImportKey, number>>(
    {} as Record<CampoImportKey, number>,
  );
  const [duplicados, setDuplicados] = useState<DuplicadoInfo[]>([]);
  const [estrategia, setEstrategia] = useState<EstrategiaDuplicado>("ignorar");
  const [resumo, setResumo] = useState<ImportResumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro("");
    setCarregando(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<string[]>(ws, {
        header: 1,
        defval: "",
        raw: false,
      });
      const naoVazias = grid.filter((r) => r.some((c) => String(c).trim()));
      if (naoVazias.length < 2) {
        setErro("O arquivo não tem linhas de dados (só cabeçalho ou vazio).");
        setCarregando(false);
        return;
      }
      const hs = naoVazias[0].map((h) => String(h).trim());
      setHeaders(hs);
      setLinhas(naoVazias.slice(1).map((r) => hs.map((_, i) => String(r[i] ?? "").trim())));
      setMapa(autoMap(hs));
      setNomeArquivo(file.name);
      setPasso("mapeamento");
    } catch {
      setErro("Não deu pra ler o arquivo. Use CSV, XLSX ou XLS.");
    } finally {
      setCarregando(false);
    }
  }

  function construirRows(): LeadImportRow[] {
    return linhas.map((linha) => {
      const row: LeadImportRow = {};
      for (const campo of CAMPOS_IMPORT) {
        const idx = mapa[campo.key];
        if (idx >= 0) row[campo.key] = linha[idx] ?? "";
      }
      return row;
    });
  }

  const rows = passo !== "arquivo" ? construirRows() : [];
  const validas = rows.filter((r) => (r.nome ?? "").trim());
  const invalidas = rows.length - validas.length;

  async function irParaRevisao() {
    setCarregando(true);
    setErro("");
    try {
      const dups = await checkLeadDuplicates(validas);
      setDuplicados(dups);
      setEstrategia(dups.length > 0 ? "ignorar" : "importar");
      setPasso("revisao");
    } catch {
      setErro("Erro ao verificar duplicados.");
    } finally {
      setCarregando(false);
    }
  }

  async function confirmar() {
    setCarregando(true);
    setErro("");
    try {
      const r = await importLeads(validas, estrategia);
      setResumo(r);
      setPasso("resultado");
    } catch {
      setErro("Erro ao importar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-ink-line bg-ink-soft shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-line p-5">
          <div>
            <h2 className="font-display text-2xl uppercase text-gelo">Importar contatos</h2>
            {nomeArquivo && <p className="text-xs text-gelo-dim">{nomeArquivo}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg border border-ink-line bg-ink p-1.5 text-gelo-dim hover:text-gelo" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Passos */}
        <div className="flex gap-1 border-b border-ink-line px-5 py-2 text-[11px] text-gelo-dim">
          {(["arquivo", "mapeamento", "revisao", "resultado"] as Passo[]).map((p, i) => (
            <span key={p} className={`rounded px-2 py-0.5 ${passo === p ? "bg-roxo/20 text-gelo" : ""}`}>
              {i + 1}. {p === "arquivo" ? "Arquivo" : p === "mapeamento" ? "Mapeamento" : p === "revisao" ? "Revisão" : "Resultado"}
            </span>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">
          {erro && (
            <p className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4" /> {erro}
            </p>
          )}

          {passo === "arquivo" && (
            <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line bg-ink p-12 text-center hover:border-roxo-light/40">
              {carregando ? (
                <Loader2 className="h-8 w-8 animate-spin text-roxo-light" />
              ) : (
                <UploadCloud className="h-8 w-8 text-gelo-dim" />
              )}
              <span className="text-sm text-gelo">Selecione um arquivo CSV, XLSX ou XLS</span>
              <span className="text-xs text-gelo-dim">A 1ª linha deve conter os títulos das colunas</span>
              <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile} className="hidden" />
            </label>
          )}

          {passo === "mapeamento" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-medium text-gelo">Mapeie as colunas</h3>
                <p className="text-xs text-gelo-dim">
                  Ligue cada campo do sistema à coluna do arquivo. Detectamos {rows.length} linha
                  {rows.length === 1 ? "" : "s"}.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CAMPOS_IMPORT.map((campo) => (
                  <label key={campo.key} className="flex items-center justify-between gap-2 rounded-lg border border-ink-line bg-ink/50 px-3 py-2">
                    <span className="text-sm text-gelo">
                      {campo.label}
                      {campo.obrigatorio && <span className="text-roxo-light"> *</span>}
                    </span>
                    <select
                      value={mapa[campo.key] ?? -1}
                      onChange={(e) => setMapa((m) => ({ ...m, [campo.key]: Number(e.target.value) }))}
                      className={inputCls}
                    >
                      <option value={-1}>—</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              {/* Prévia */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gelo">Prévia</h3>
                <div className="overflow-x-auto rounded-xl border border-ink-line">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ink text-gelo-dim">
                      <tr>
                        <th className="px-3 py-2">Nome</th>
                        <th className="px-3 py-2">Empresa</th>
                        <th className="px-3 py-2">Telefone</th>
                        <th className="px-3 py-2">E-mail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-ink-line text-gelo">
                          <td className="px-3 py-1.5">{r.nome || <span className="text-red-300/70">(vazio)</span>}</td>
                          <td className="px-3 py-1.5">{r.empresa}</td>
                          <td className="px-3 py-1.5">{r.telefone || r.whatsapp}</td>
                          <td className="px-3 py-1.5">{r.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {invalidas > 0 && (
                  <p className="mt-2 text-xs text-yellow-300/90">
                    {invalidas} linha{invalidas === 1 ? "" : "s"} sem nome ser
                    {invalidas === 1 ? "á" : "ão"} ignorada{invalidas === 1 ? "" : "s"}.
                  </p>
                )}
              </div>
            </div>
          )}

          {passo === "revisao" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-ink-line bg-ink p-4">
                  <div className="font-display text-2xl text-gelo">{validas.length}</div>
                  <div className="text-xs text-gelo-dim">válidos</div>
                </div>
                <div className="rounded-xl border border-ink-line bg-ink p-4">
                  <div className="font-display text-2xl text-yellow-300">{invalidas}</div>
                  <div className="text-xs text-gelo-dim">sem nome</div>
                </div>
                <div className="rounded-xl border border-ink-line bg-ink p-4">
                  <div className="font-display text-2xl text-roxo-light">{duplicados.length}</div>
                  <div className="text-xs text-gelo-dim">duplicados</div>
                </div>
              </div>

              {duplicados.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gelo">
                    Possíveis duplicados
                  </h3>
                  <ul className="max-h-32 overflow-y-auto overscroll-contain rounded-xl border border-ink-line">
                    {duplicados.slice(0, 20).map((d) => (
                      <li key={d.index} className="flex items-center justify-between border-b border-ink-line px-3 py-1.5 text-xs last:border-0">
                        <span className="text-gelo">{validas[d.index]?.nome}</span>
                        <span className="text-gelo-dim">já existe ({d.motivo})</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-col gap-2">
                    <span className="text-xs text-gelo-dim">O que fazer com os duplicados?</span>
                    {(
                      [
                        ["ignorar", "Ignorar duplicados"],
                        ["atualizar", "Atualizar os existentes"],
                        ["importar", "Importar mesmo assim"],
                      ] as [EstrategiaDuplicado, string][]
                    ).map(([val, label]) => (
                      <label key={val} className="flex items-center gap-2 text-sm text-gelo">
                        <input
                          type="radio"
                          name="estrategia"
                          checked={estrategia === val}
                          onChange={() => setEstrategia(val)}
                          className="h-4 w-4 accent-[var(--color-roxo)]"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gelo-dim">
                Todos os contatos importados entram na etapa <strong className="text-gelo">Novo</strong>.
              </p>
            </div>
          )}

          {passo === "resultado" && resumo && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h3 className="font-display text-2xl uppercase text-gelo">Importação concluída</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Importados", resumo.importados, "text-emerald-400"],
                  ["Atualizados", resumo.atualizados, "text-sky-400"],
                  ["Ignorados", resumo.ignorados, "text-gelo-dim"],
                  ["Erros", resumo.erros, "text-red-400"],
                ].map(([label, v, cls]) => (
                  <div key={label as string} className="rounded-xl border border-ink-line bg-ink p-4">
                    <div className={`font-display text-2xl ${cls}`}>{v as number}</div>
                    <div className="text-xs text-gelo-dim">{label as string}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé / navegação */}
        <div className="flex items-center justify-between border-t border-ink-line p-4">
          <button
            onClick={() => {
              if (passo === "mapeamento") setPasso("arquivo");
              else if (passo === "revisao") setPasso("mapeamento");
              else onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-4 py-2 text-sm text-gelo-dim hover:text-gelo"
          >
            {passo === "arquivo" || passo === "resultado" ? "Fechar" : (<><ArrowLeft className="h-4 w-4" /> Voltar</>)}
          </button>

          {passo === "mapeamento" && (
            <button
              onClick={irParaRevisao}
              disabled={carregando || validas.length === 0 || mapa.nome < 0}
              className="flex items-center gap-1.5 rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Revisar
            </button>
          )}
          {passo === "revisao" && (
            <button
              onClick={confirmar}
              disabled={carregando}
              className="flex items-center gap-1.5 rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Importar {validas.length} contato{validas.length === 1 ? "" : "s"}
            </button>
          )}
          {passo === "resultado" && (
            <button onClick={onClose} className="rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white">
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
