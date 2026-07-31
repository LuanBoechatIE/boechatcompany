"use client";

// Barra de ações em lote. Aparece flutuando quando há lead selecionado e some
// quando a seleção esvazia. Cada botão abre um popover pequeno em vez de um
// modal: a ação em lote é rápida e não merece troca de contexto.

import { useEffect, useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  UserRoundCog,
  ArrowRightLeft,
  Flag,
  Tag,
  CircleSlash,
  Trash2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { LEAD_STAGES, LEAD_PRIORIDADES, type LeadStatus } from "@/app/lib/crm/types";
import {
  acaoEmLote,
  listUsuariosAtivos,
  type AcaoLote,
  type UsuarioBasico,
} from "../../crm-actions";

// Motivos padronizados do vault. Sem padrão não dá pra diagnosticar depois por
// que o funil vaza, então a lista é sugerida em vez de campo livre puro.
const MOTIVOS_PERDA = [
  "sem estoque suficiente",
  "não é decisor",
  "preço",
  "já tem sistema/site",
  "sem interesse",
  "sumiu/no-show",
  "fora do ICP",
];

type Popover = "responsavel" | "status" | "prioridade" | "tags" | "perdido" | "excluir";

type Feedback = { ok: boolean; texto: string } | null;

// Fora do componente de propósito: declarado dentro do render, o React remonta
// o popover (e perde o texto digitado) a cada re-render do pai.
function Pop({ children, largura = "w-56" }: { children: React.ReactNode; largura?: string }) {
  return (
    <div
      className={`absolute bottom-full left-1/2 mb-2 -translate-x-1/2 ${largura} rounded-xl border border-ink-line bg-ink p-1.5 shadow-2xl`}
    >
      {children}
    </div>
  );
}

export function LeadsSelecaoBar({
  ids,
  onLimpar,
  onAplicado,
  podeReatribuir,
}: {
  ids: number[];
  onLimpar: () => void;
  onAplicado: () => void;
  podeReatribuir: boolean;
}) {
  const [aberto, setAberto] = useState<Popover | null>(null);
  const [pendente, start] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [usuarios, setUsuarios] = useState<UsuarioBasico[]>([]);
  const [tagTexto, setTagTexto] = useState("");
  const [motivo, setMotivo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listUsuariosAtivos()
      .then(setUsuarios)
      .catch(() => setUsuarios([]));
  }, []);

  // Fecha o popover ao clicar fora ou apertar Escape. A seleção em si continua.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Some o feedback sozinho pra não virar sujeira permanente na tela.
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(t);
  }, [feedback]);

  const aplicar = (acao: AcaoLote) => {
    setAberto(null);
    start(async () => {
      const r = await acaoEmLote(ids, acao);
      if (!r.ok) {
        setFeedback({ ok: false, texto: r.erro ?? "Não foi possível aplicar." });
        return;
      }
      const partes = [`${r.afetados} ${r.afetados === 1 ? "lead atualizado" : "leads atualizados"}`];
      if (r.semAcesso > 0) partes.push(`${r.semAcesso} fora do seu acesso`);
      setFeedback({ ok: true, texto: partes.join(" · ") });
      setTagTexto("");
      setMotivo("");
      onAplicado();
    });
  };

  const n = ids.length;
  const btn =
    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-gelo-dim transition-colors hover:bg-ink hover:text-gelo disabled:opacity-40";
  const btnAtivo = "bg-ink text-gelo";
  const itemPop =
    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-gelo-dim hover:bg-ink-soft hover:text-gelo";

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
    >
      <div
        ref={ref}
        className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-ink-line bg-ink-soft/95 p-1.5 shadow-2xl backdrop-blur"
      >
        <span className="flex items-center gap-2 rounded-lg bg-roxo/15 px-3 py-1.5 text-[13px] font-medium text-roxo-light">
          {n} {n === 1 ? "selecionado" : "selecionados"}
        </span>

        {/* Responsável */}
        {podeReatribuir && (
          <div className="relative">
            <button
              disabled={pendente}
              onClick={() => setAberto(aberto === "responsavel" ? null : "responsavel")}
              className={`${btn} ${aberto === "responsavel" ? btnAtivo : ""}`}
            >
              <UserRoundCog className="h-4 w-4" /> Responsável
            </button>
            {aberto === "responsavel" && (
              <Pop>
                <div className="max-h-64 overflow-y-auto">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      className={itemPop}
                      onClick={() => aplicar({ tipo: "responsavel", usuarioId: u.id })}
                    >
                      {u.nome}
                    </button>
                  ))}
                  <button
                    className={`${itemPop} text-gelo-dim/60`}
                    onClick={() => aplicar({ tipo: "responsavel", usuarioId: null })}
                  >
                    Sem responsável
                  </button>
                </div>
              </Pop>
            )}
          </div>
        )}

        {/* Etapa */}
        <div className="relative">
          <button
            disabled={pendente}
            onClick={() => setAberto(aberto === "status" ? null : "status")}
            className={`${btn} ${aberto === "status" ? btnAtivo : ""}`}
          >
            <ArrowRightLeft className="h-4 w-4" /> Etapa
          </button>
          {aberto === "status" && (
            <Pop>
              {LEAD_STAGES.map((s) => (
                <button
                  key={s.key}
                  className={itemPop}
                  onClick={() => aplicar({ tipo: "status", status: s.key as LeadStatus })}
                >
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} /> {s.label}
                </button>
              ))}
            </Pop>
          )}
        </div>

        {/* Prioridade */}
        <div className="relative">
          <button
            disabled={pendente}
            onClick={() => setAberto(aberto === "prioridade" ? null : "prioridade")}
            className={`${btn} ${aberto === "prioridade" ? btnAtivo : ""}`}
          >
            <Flag className="h-4 w-4" /> Prioridade
          </button>
          {aberto === "prioridade" && (
            <Pop largura="w-44">
              {LEAD_PRIORIDADES.map((p) => (
                <button
                  key={p.key}
                  className={itemPop}
                  onClick={() => aplicar({ tipo: "prioridade", prioridade: p.key })}
                >
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} /> {p.label}
                </button>
              ))}
            </Pop>
          )}
        </div>

        {/* Tags */}
        <div className="relative">
          <button
            disabled={pendente}
            onClick={() => setAberto(aberto === "tags" ? null : "tags")}
            className={`${btn} ${aberto === "tags" ? btnAtivo : ""}`}
          >
            <Tag className="h-4 w-4" /> Tags
          </button>
          {aberto === "tags" && (
            <Pop largura="w-72">
              <div className="p-1.5">
                <input
                  autoFocus
                  value={tagTexto}
                  onChange={(e) => setTagTexto(e.target.value)}
                  placeholder="concessionarias, rj"
                  className="w-full rounded-lg border border-ink-line bg-ink-soft px-2.5 py-1.5 text-[13px] text-gelo outline-none placeholder:text-gelo-dim/40 focus:border-roxo-light/50"
                />
                <p className="mt-1 text-[11px] text-gelo-dim/50">
                  Separe por vírgula. Adicionar não duplica o que já existe.
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    disabled={!tagTexto.trim()}
                    onClick={() => aplicar({ tipo: "tagsAdd", tags: tagTexto })}
                    className="flex-1 rounded-lg bg-roxo px-2 py-1.5 text-[13px] text-white disabled:opacity-40"
                  >
                    Adicionar
                  </button>
                  <button
                    disabled={!tagTexto.trim()}
                    onClick={() => aplicar({ tipo: "tagsRemove", tags: tagTexto })}
                    className="flex-1 rounded-lg border border-ink-line px-2 py-1.5 text-[13px] text-gelo-dim hover:text-gelo disabled:opacity-40"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </Pop>
          )}
        </div>

        <div className="mx-0.5 h-6 w-px bg-ink-line" />

        {/* Marcar perdido */}
        <div className="relative">
          <button
            disabled={pendente}
            onClick={() => setAberto(aberto === "perdido" ? null : "perdido")}
            className={`${btn} text-red-300/80 hover:text-red-300 ${aberto === "perdido" ? btnAtivo : ""}`}
          >
            <CircleSlash className="h-4 w-4" /> Perdido
          </button>
          {aberto === "perdido" && (
            <Pop largura="w-72">
              <div className="p-1.5">
                <input
                  autoFocus
                  list="motivos-perda-lote"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo da perda"
                  className="w-full rounded-lg border border-ink-line bg-ink-soft px-2.5 py-1.5 text-[13px] text-gelo outline-none placeholder:text-gelo-dim/40 focus:border-roxo-light/50"
                />
                <datalist id="motivos-perda-lote">
                  {MOTIVOS_PERDA.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <p className="mt-1 text-[11px] text-gelo-dim/50">
                  Use os motivos padrão. Sem padrão não dá pra diagnosticar o funil depois.
                </p>
                <button
                  onClick={() => aplicar({ tipo: "perdido", motivo })}
                  className="mt-2 w-full rounded-lg bg-red-500/80 px-2 py-1.5 text-[13px] text-white"
                >
                  Marcar {n} como perdido
                </button>
              </div>
            </Pop>
          )}
        </div>

        {/* Excluir */}
        <div className="relative">
          <button
            disabled={pendente}
            onClick={() => setAberto(aberto === "excluir" ? null : "excluir")}
            className={`${btn} text-red-300/70 hover:text-red-300 ${aberto === "excluir" ? btnAtivo : ""}`}
          >
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
          {aberto === "excluir" && (
            <Pop largura="w-72">
              <div className="p-2">
                <p className="text-[13px] text-gelo">
                  Excluir <b>{n}</b> {n === 1 ? "lead" : "leads"} de vez?
                </p>
                <p className="mt-1 text-[11px] text-red-300/80">
                  Some o histórico junto (atividades, notas, auditoria). Não dá pra desfazer.
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => setAberto(null)}
                    className="flex-1 rounded-lg border border-ink-line px-2 py-1.5 text-[13px] text-gelo-dim hover:text-gelo"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => aplicar({ tipo: "excluir" })}
                    className="flex-1 rounded-lg bg-red-500/80 px-2 py-1.5 text-[13px] text-white"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </Pop>
          )}
        </div>

        <div className="mx-0.5 h-6 w-px bg-ink-line" />

        {pendente && <Loader2 className="mx-1.5 h-4 w-4 animate-spin text-roxo-light" />}
        {!pendente && feedback && (
          <span
            className={`flex items-center gap-1.5 px-2 text-[12px] ${
              feedback.ok ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {feedback.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {feedback.texto}
          </span>
        )}

        <button onClick={onLimpar} className={btn} title="Limpar seleção (Esc)">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
