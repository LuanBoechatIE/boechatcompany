"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Star,
  X,
  Bookmark,
  Trash2,
  Check,
} from "lucide-react";
import {
  LEAD_STAGES,
  LEAD_PRIORIDADES,
  ORIGENS_LEAD,
  SERVICOS,
  RESPONSAVEIS,
  type FiltroSalvoDTO,
} from "@/app/lib/crm/types";
import { saveFiltro, deleteFiltro } from "../../crm-actions";

const inputCls =
  "rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-gelo-dim outline-none focus:border-roxo-light/50";

// Chips de filtro rápido: cada um é um conjunto de params.
const CHIPS: { label: string; params: Record<string, string> }[] = [
  { label: "Atrasados", params: { followup: "atrasado" } },
  { label: "Follow-up hoje", params: { followup: "hoje" } },
  { label: "Quentes", params: { temperatura: "quente" } },
  { label: "Sem responsável", params: { semResponsavel: "1" } },
  { label: "Criados hoje", params: { criados: "hoje" } },
  { label: "Ganhos", params: { ganhos: "1" } },
  { label: "Perdidos", params: { perdidos: "1" } },
];

const CAMPOS_FILTRO = [
  "q", "responsavel", "origem", "servico", "status", "prioridade", "temperatura",
  "tag", "followup", "criados", "modificados", "semInteracao", "semResponsavel",
  "ganhos", "perdidos", "valorMin", "valorMax",
] as const;

export function LeadsFilterBar({
  filtros,
  filtrosSalvos,
}: {
  filtros: Record<string, string>;
  filtrosSalvos: FiltroSalvoDTO[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [busca, setBusca] = useState(filtros.q ?? "");
  const [avancadoOpen, setAvancadoOpen] = useState(false);
  const [salvosOpen, setSalvosOpen] = useState(false);
  const [nomeFiltro, setNomeFiltro] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setBusca(filtros.q ?? ""), [filtros.q]);

  // Navega aplicando um conjunto de params (merge sobre os atuais).
  function aplicar(patch: Record<string, string | null>) {
    const next: Record<string, string> = { ...filtros };
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") delete next[k];
      else next[k] = v;
    }
    const qs = new URLSearchParams(next).toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function substituir(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function onBusca(v: string) {
    setBusca(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => aplicar({ q: v || null }), 300);
  }

  const chipAtivo = (params: Record<string, string>) =>
    Object.entries(params).every(([k, v]) => filtros[k] === v);

  const toggleChip = (params: Record<string, string>) => {
    if (chipAtivo(params)) {
      aplicar(Object.fromEntries(Object.keys(params).map((k) => [k, null])));
    } else {
      aplicar(params);
    }
  };

  const ativos = CAMPOS_FILTRO.filter((k) => filtros[k]).length;

  async function onSalvar() {
    const nome = nomeFiltro.trim();
    if (!nome) return;
    const atual: Record<string, string> = {};
    for (const k of CAMPOS_FILTRO) if (filtros[k]) atual[k] = filtros[k];
    await saveFiltro(nome, atual);
    setNomeFiltro("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Busca instantânea */}
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gelo-dim" />
          <input
            id="lead-search"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="Buscar por nome, empresa, contato, e-mail, tag...  (/)"
            className={`${inputCls} w-full pl-9`}
          />
        </div>

        {/* Filtros avançados */}
        <div className="relative">
          <button
            onClick={() => { setAvancadoOpen((v) => !v); setSalvosOpen(false); }}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
              ativos > 0 || avancadoOpen
                ? "border-roxo-light/50 bg-roxo/10 text-gelo"
                : "border-ink-line bg-ink text-gelo-dim hover:text-gelo"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {ativos > 0 && (
              <span className="rounded-full bg-roxo px-1.5 text-[10px] text-white">{ativos}</span>
            )}
          </button>
          {avancadoOpen && (
            <PainelAvancado filtros={filtros} onAplicar={aplicar} onFechar={() => setAvancadoOpen(false)} />
          )}
        </div>

        {/* Filtros salvos */}
        <div className="relative">
          <button
            onClick={() => { setSalvosOpen((v) => !v); setAvancadoOpen(false); }}
            className="flex items-center gap-2 rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-gelo-dim hover:text-gelo"
          >
            <Bookmark className="h-4 w-4" />
            Salvos
          </button>
          {salvosOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-ink-line bg-ink-soft p-2 shadow-2xl">
              {filtrosSalvos.length === 0 ? (
                <p className="px-2 py-3 text-center text-[12px] text-gelo-dim/60">
                  Nenhum filtro salvo ainda.
                </p>
              ) : (
                <ul className="mb-2 flex flex-col">
                  {filtrosSalvos.map((f) => (
                    <li key={f.id} className="flex items-center gap-1">
                      <button
                        onClick={() => { substituir(f.filtro); setSalvosOpen(false); }}
                        className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gelo-dim hover:bg-ink hover:text-gelo"
                      >
                        <Star className="h-3.5 w-3.5 text-roxo-light" />
                        {f.nome}
                      </button>
                      <button
                        onClick={() => deleteFiltro(f.id)}
                        className="rounded-md p-1.5 text-red-300/50 hover:text-red-300"
                        aria-label="Excluir filtro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {ativos > 0 && (
                <div className="flex items-center gap-1 border-t border-ink-line pt-2">
                  <input
                    value={nomeFiltro}
                    onChange={(e) => setNomeFiltro(e.target.value)}
                    placeholder="Nome do filtro atual"
                    className="flex-1 rounded-lg border border-ink-line bg-ink px-2 py-1.5 text-sm outline-none focus:border-roxo-light/50"
                  />
                  <button
                    onClick={onSalvar}
                    className="rounded-lg bg-roxo p-2 text-white hover:opacity-90"
                    aria-label="Salvar filtro"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {ativos > 0 && (
          <button
            onClick={() => substituir({})}
            className="flex items-center gap-1 text-sm text-gelo-dim hover:text-gelo"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Chips rápidos */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CHIPS.map((c) => {
          const ativo = chipAtivo(c.params);
          return (
            <button
              key={c.label}
              onClick={() => toggleChip(c.params)}
              className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                ativo
                  ? "border-roxo-light/50 bg-roxo/15 text-gelo"
                  : "border-ink-line bg-ink text-gelo-dim hover:text-gelo"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PainelAvancado({
  filtros,
  onAplicar,
  onFechar,
}: {
  filtros: Record<string, string>;
  onAplicar: (patch: Record<string, string | null>) => void;
  onFechar: () => void;
}) {
  const sel = (name: string) => filtros[name] ?? "";
  const set = (name: string, v: string) => onAplicar({ [name]: v || null });

  const selCls =
    "w-full rounded-lg border border-ink-line bg-ink px-2.5 py-2 text-sm text-gelo-dim outline-none focus:border-roxo-light/50";
  const lbl = "text-[11px] text-gelo-dim";

  return (
    <div className="absolute right-0 top-full z-30 mt-2 w-[22rem] rounded-xl border border-ink-line bg-ink-soft p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gelo">Filtros avançados</span>
        <button onClick={onFechar} className="text-gelo-dim hover:text-gelo" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={lbl}>Responsável</span>
          <select value={sel("responsavel")} onChange={(e) => set("responsavel", e.target.value)} className={selCls}>
            <option value="">Todos</option>
            {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Origem</span>
          <select value={sel("origem")} onChange={(e) => set("origem", e.target.value)} className={selCls}>
            <option value="">Todas</option>
            {ORIGENS_LEAD.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Serviço</span>
          <select value={sel("servico")} onChange={(e) => set("servico", e.target.value)} className={selCls}>
            <option value="">Todos</option>
            {SERVICOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Etapa</span>
          <select value={sel("status")} onChange={(e) => set("status", e.target.value)} className={selCls}>
            <option value="">Todas</option>
            {LEAD_STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Prioridade</span>
          <select value={sel("prioridade")} onChange={(e) => set("prioridade", e.target.value)} className={selCls}>
            <option value="">Todas</option>
            {LEAD_PRIORIDADES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Temperatura</span>
          <select value={sel("temperatura")} onChange={(e) => set("temperatura", e.target.value)} className={selCls}>
            <option value="">Todas</option>
            <option value="quente">Quente</option>
            <option value="morno">Morno</option>
            <option value="frio">Frio</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Follow-up</span>
          <select value={sel("followup")} onChange={(e) => set("followup", e.target.value)} className={selCls}>
            <option value="">Qualquer</option>
            <option value="atrasado">Atrasado</option>
            <option value="hoje">Hoje</option>
            <option value="futuro">Futuro</option>
            <option value="sem">Sem follow-up</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Sem interação há</span>
          <select value={sel("semInteracao")} onChange={(e) => set("semInteracao", e.target.value)} className={selCls}>
            <option value="">Qualquer</option>
            {[1, 3, 5, 7, 15, 30].map((d) => <option key={d} value={d}>{d}+ dias</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Modificados</span>
          <select value={sel("modificados")} onChange={(e) => set("modificados", e.target.value)} className={selCls}>
            <option value="">Qualquer</option>
            <option value="hoje">Hoje</option>
            <option value="semana">Esta semana</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Tag</span>
          <input defaultValue={sel("tag")} onBlur={(e) => set("tag", e.target.value)} placeholder="ex.: indicação" className={selCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Valor mín. (R$)</span>
          <input defaultValue={sel("valorMin")} onBlur={(e) => set("valorMin", e.target.value)} placeholder="0" className={selCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={lbl}>Valor máx. (R$)</span>
          <input defaultValue={sel("valorMax")} onBlur={(e) => set("valorMax", e.target.value)} placeholder="—" className={selCls} />
        </label>
      </div>
    </div>
  );
}
