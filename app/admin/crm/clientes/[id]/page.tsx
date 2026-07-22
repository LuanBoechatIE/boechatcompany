import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc, asc, inArray } from "drizzle-orm";
import {
  ArrowLeft,
  Trash2,
  Check,
  KanbanSquare,
  ListTodo,
  Plus,
  Circle,
  CircleDot,
  Plug,
  Mail,
  Phone,
  MapPin,
  Globe,
  Instagram,
  FileSignature,
} from "lucide-react";
import { getDb } from "@/app/lib/db";
import {
  crmClientes,
  contratos,
  pagamentos,
  projetos,
  demandas,
  tarefas,
  estrategiaItems,
} from "@/app/lib/db/schema";
import { formatBRL, formatDate } from "@/app/lib/crm/format";
import {
  ESTRATEGIA_FASES,
  PROJETO_STATUS_LABEL,
  type ProjetoStatus,
} from "@/app/lib/crm/types";
import { ClienteTabs } from "./ClienteTabs";
import { IntegracaoForm } from "./IntegracaoForm";
import { NovoItem } from "../../estrategia/NovoItem";
import { cryptoConfigured } from "@/app/lib/crm/crypto";
import { getIntegracaoView } from "../../../integracoes-actions";
import {
  deleteCrmCliente,
  updateCrmCliente,
  updateEstrategiaStatus,
  deleteEstrategiaItem,
} from "../../../crm-actions";
import {
  createContrato,
  updateContratoStatus,
  deleteContrato,
  createPagamento,
  markPagamentoPago,
  deletePagamento,
} from "../../../financeiro-actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";
const lbl = "text-xs text-gelo-dim";

const STATUS_CLIENTE: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  arquivado: "Arquivado",
};
const CONTRATO_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  encerrado: "Encerrado",
};
const CONTRATO_STATUS_CLS: Record<string, string> = {
  ativo: "border-emerald-500/30 text-emerald-200/90",
  pausado: "border-yellow-500/30 text-yellow-200/90",
  encerrado: "border-ink-line text-gelo-dim",
};
const PAGAMENTO_STATUS_LABEL: Record<string, string> = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
};
const PROX: Record<string, string> = { todo: "doing", doing: "done", done: "todo" };

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <div className={lbl}>{label}</div>
      <div className="mt-0.5 text-sm text-gelo">{valor?.trim() || "—"}</div>
    </div>
  );
}

export default async function ClienteDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = Number(id);
  if (!clienteId) notFound();

  const db = getDb();
  const cRows = await db
    .select()
    .from(crmClientes)
    .where(eq(crmClientes.id, clienteId))
    .limit(1);
  const cliente = cRows[0];
  if (!cliente) notFound();

  const [contratosRows, pagamentosRows, projetosRows, demandasRows, estrsRows] =
    await Promise.all([
      db.select().from(contratos).where(eq(contratos.clienteId, clienteId)).orderBy(desc(contratos.criadoEm)),
      db.select().from(pagamentos).where(eq(pagamentos.clienteId, clienteId)).orderBy(desc(pagamentos.vencimento)),
      db.select().from(projetos).where(eq(projetos.clienteId, clienteId)).orderBy(desc(projetos.criadoEm)),
      db.select().from(demandas).where(eq(demandas.clienteId, clienteId)),
      db.select().from(estrategiaItems).where(eq(estrategiaItems.clienteId, clienteId)).orderBy(asc(estrategiaItems.ordem)),
    ]);

  const projetoIds = projetosRows.map((p) => p.id);
  const tarefasRows = projetoIds.length
    ? await db.select().from(tarefas).where(inArray(tarefas.projetoId, projetoIds))
    : [];

  const [metaView, googleView] = await Promise.all([
    getIntegracaoView(clienteId, "meta"),
    getIntegracaoView(clienteId, "google"),
  ]);
  const cryptoOk = cryptoConfigured();

  const now = new Date();
  const pagamentosPorContrato = new Map<number, typeof pagamentosRows>();
  for (const p of pagamentosRows) {
    const arr = pagamentosPorContrato.get(p.contratoId) ?? [];
    arr.push(p);
    pagamentosPorContrato.set(p.contratoId, arr);
  }

  const contratosAtivos = contratosRows.filter((x) => x.status === "ativo");
  const mrr = contratosAtivos.reduce((s, x) => s + Number(x.valorRecorrente), 0);
  const pgPendentes = pagamentosRows.filter((p) => p.status !== "pago");
  const pgAtrasados = pgPendentes.filter(
    (p) => p.status === "atrasado" || new Date(p.vencimento) < now,
  );
  const demandasAbertas = demandasRows.filter((d) => d.status !== "concluido");
  const proximasTarefas = tarefasRows
    .filter((t) => t.status !== "done" && t.prazo)
    .sort((a, b) => new Date(a.prazo!).getTime() - new Date(b.prazo!).getTime())
    .slice(0, 6);

  // Bloco de contratos + pagamentos (módulo financeiro).
  const contratosBloco = (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
        <FileSignature className="h-4 w-4" /> Contratos
      </h2>
      <div className="flex flex-col gap-3">
        {contratosRows.map((c) => {
          const pgs = pagamentosPorContrato.get(c.id) ?? [];
          return (
            <div key={c.id} className="rounded-2xl border border-ink-line bg-ink-soft/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-gelo">{c.servico}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gelo-dim">
                    {Number(c.valorImplementacao) > 0 && (
                      <span>{formatBRL(Number(c.valorImplementacao))} implementação</span>
                    )}
                    {Number(c.valorRecorrente) > 0 && (
                      <span>{formatBRL(Number(c.valorRecorrente))}/mês recorrente</span>
                    )}
                    <span>desde {formatDate(c.dataInicio)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] ${CONTRATO_STATUS_CLS[c.status] ?? ""}`}>
                    {CONTRATO_STATUS_LABEL[c.status] ?? c.status}
                  </span>
                  <form action={updateContratoStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="clienteId" value={clienteId} />
                    <input type="hidden" name="status" value={c.status === "ativo" ? "pausado" : "ativo"} />
                    <button className="rounded-lg border border-ink-line px-2.5 py-1 text-[11px] text-gelo-dim hover:border-roxo-light/40 hover:text-gelo">
                      {c.status === "ativo" ? "Pausar" : "Reativar"}
                    </button>
                  </form>
                  <form action={updateContratoStatus}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="clienteId" value={clienteId} />
                    <input type="hidden" name="status" value="encerrado" />
                    <button className="rounded-lg border border-ink-line px-2.5 py-1 text-[11px] text-gelo-dim hover:border-red-500/40 hover:text-red-300">
                      Encerrar
                    </button>
                  </form>
                  <form action={deleteContrato}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="clienteId" value={clienteId} />
                    <button className="rounded-lg border border-ink-line p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300" aria-label="Excluir contrato">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>

              {pgs.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-ink-line/60 pt-3">
                  {pgs.map((p) => {
                    const atrasado = p.status === "pendente" && new Date(p.vencimento) < now;
                    return (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-gelo-dim">
                          {formatBRL(Number(p.valor))} · vence {formatDate(p.vencimento)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={p.status === "pago" ? "text-emerald-300" : atrasado ? "text-red-300" : "text-gelo-dim"}>
                            {atrasado ? "Atrasado" : PAGAMENTO_STATUS_LABEL[p.status] ?? p.status}
                          </span>
                          {p.status !== "pago" && (
                            <form action={markPagamentoPago}>
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="clienteId" value={clienteId} />
                              <button className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-0.5 text-emerald-200/90 hover:bg-emerald-500/10" aria-label="Marcar como pago">
                                <Check className="h-3 w-3" /> Marcar pago
                              </button>
                            </form>
                          )}
                          <form action={deletePagamento}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="clienteId" value={clienteId} />
                            <button className="text-gelo-dim/60 hover:text-red-300" aria-label="Excluir pagamento">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </form>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <details className="mt-3 border-t border-ink-line/60 pt-3">
                <summary className="cursor-pointer text-[11px] text-roxo-light">
                  + Registrar pagamento avulso
                </summary>
                <form action={createPagamento} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="contratoId" value={c.id} />
                  <input type="hidden" name="clienteId" value={clienteId} />
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-gelo-dim">Tipo</span>
                    <select name="tipo" className={`${inputCls} py-1.5`}>
                      <option value="implementacao">Implementação</option>
                      <option value="recorrente">Recorrente</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-gelo-dim">Valor</span>
                    <input name="valor" type="number" step="0.01" className={`${inputCls} w-28 py-1.5`} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] text-gelo-dim">Vencimento</span>
                    <input name="vencimento" type="date" className={`${inputCls} py-1.5`} />
                  </label>
                  <button className="rounded-full bg-roxo px-4 py-1.5 text-xs font-medium text-white">
                    Adicionar
                  </button>
                </form>
              </details>
            </div>
          );
        })}

        {contratosRows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-6 text-center text-sm text-gelo-dim">
            Nenhum contrato ainda.
          </p>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-dashed border-ink-line bg-ink-soft/10 p-4">
        <summary className="flex cursor-pointer items-center gap-1.5 text-sm text-roxo-light">
          <Plus className="h-3.5 w-3.5" /> Novo contrato
        </summary>
        <form action={createContrato} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="clienteId" value={clienteId} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gelo-dim">Serviço *</span>
            <input name="servico" required className={inputCls} placeholder="Ex.: Gestão de tráfego" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Valor implementação</span>
              <input name="valorImplementacao" type="number" step="0.01" className={inputCls} placeholder="0" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Valor recorrente/mês</span>
              <input name="valorRecorrente" type="number" step="0.01" className={inputCls} placeholder="0" />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gelo-dim">Início</span>
            <input name="dataInicio" type="date" className={inputCls} />
          </label>
          <button className="w-fit rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white">
            Criar contrato
          </button>
        </form>
      </details>
    </div>
  );

  // ── Aba GERAL ──────────────────────────────────────────────────────────────
  const geral = (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">Dados cadastrais</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Campo label="Empresa" valor={cliente.empresa} />
          <Campo label="Responsável" valor={cliente.nome} />
          <Campo label="Segmento" valor={cliente.segmento} />
          <Campo label="WhatsApp" valor={cliente.whatsapp} />
          <Campo label="Telefone" valor={cliente.telefone} />
          <Campo label="E-mail" valor={cliente.email} />
          <Campo label="Cidade / UF" valor={[cliente.cidade, cliente.estado].filter(Boolean).join(" / ")} />
          <Campo label="Site" valor={cliente.site} />
          <Campo label="Instagram" valor={cliente.instagram} />
          <Campo label="Responsável interno" valor={cliente.responsavelInterno} />
          <Campo label="Entrada" valor={formatDate(cliente.criadoEm)} />
          <Campo label="Status" valor={STATUS_CLIENTE[cliente.statusCliente] ?? cliente.statusCliente} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
          <div className="text-xs uppercase tracking-wide text-gelo-dim">Recorrente (MRR)</div>
          <div className="mt-1 font-display text-3xl text-gelo">{formatBRL(mrr)}</div>
          <div className="mt-1 text-xs text-gelo-dim">{contratosAtivos.length} contrato(s) ativo(s)</div>
        </div>
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
          <div className="text-xs uppercase tracking-wide text-gelo-dim">Projetos</div>
          <div className="mt-1 font-display text-3xl text-gelo">{projetosRows.length}</div>
          <div className="mt-1 text-xs text-gelo-dim">{demandasAbertas.length} demanda(s) aberta(s)</div>
        </div>
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
          <div className="text-xs uppercase tracking-wide text-gelo-dim">Pagamentos pendentes</div>
          <div className={`mt-1 font-display text-3xl ${pgAtrasados.length ? "text-red-400" : "text-gelo"}`}>
            {pgPendentes.length}
          </div>
          <div className="mt-1 text-xs text-gelo-dim">{pgAtrasados.length} em atraso</div>
        </div>
      </div>

      {contratosBloco}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">Próximas tarefas</h3>
          {proximasTarefas.length === 0 ? (
            <p className="text-sm text-gelo-dim">Nada agendado.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {proximasTarefas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-gelo">{t.titulo}</span>
                  <span className="shrink-0 text-xs text-gelo-dim">{formatDate(t.prazo!)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-roxo/30 bg-roxo/5 p-5">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">Próximos passos</h3>
          <p className="whitespace-pre-wrap text-sm text-gelo-dim">
            {cliente.proximosPassos?.trim() || "Defina os próximos passos na aba Configurações."}
          </p>
        </div>
      </div>

      {cliente.observacoes && (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gelo">Observações</h3>
          <p className="whitespace-pre-wrap text-sm text-gelo-dim">{cliente.observacoes}</p>
        </div>
      )}
    </div>
  );

  // ── Aba PROJETO ────────────────────────────────────────────────────────────
  const projeto = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gelo">Projetos do cliente</h3>
        <Link href="/admin/crm/projetos/novo" className="rounded-full bg-roxo px-4 py-2 text-xs font-medium text-white">
          Novo projeto
        </Link>
      </div>
      {projetosRows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-8 text-center text-sm text-gelo-dim">
          Nenhum projeto vinculado. Crie um e selecione este cliente.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {projetosRows.map((p) => {
            const abertas = tarefasRows.filter((t) => t.projetoId === p.id && t.status !== "done").length;
            return (
              <li key={p.id}>
                <Link href={`/admin/crm/projetos/${p.id}`} className="group flex flex-col gap-2 rounded-2xl border border-ink-line bg-ink-soft/30 p-4 transition-colors hover:border-roxo-light/40">
                  <div className="flex items-center justify-between">
                    <KanbanSquare className="h-5 w-5 text-roxo-light" />
                    <span className="rounded-full border border-ink-line px-2 py-0.5 text-[10px] uppercase text-gelo-dim">
                      {PROJETO_STATUS_LABEL[p.status as ProjetoStatus] ?? p.status}
                    </span>
                  </div>
                  <span className="font-medium text-gelo group-hover:text-roxo-light">{p.nome}</span>
                  <span className="text-xs text-gelo-dim">{abertas} tarefa(s) em aberto</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {demandasAbertas.length > 0 && (
        <div>
          <h3 className="mb-2 mt-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
            <ListTodo className="h-4 w-4" /> Demandas abertas
          </h3>
          <ul className="flex flex-col gap-2">
            {demandasAbertas.map((d) => (
              <li key={d.id} className="rounded-xl border border-ink-line bg-ink-soft/30 px-4 py-2.5 text-sm text-gelo">
                {d.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // ── Aba ESTRATÉGIA ─────────────────────────────────────────────────────────
  const estrategia = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gelo">Plano por fases</h3>
        <NovoItem clienteId={clienteId} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {ESTRATEGIA_FASES.map((fase) => {
          const itens = estrsRows.filter((i) => i.fase === fase.key);
          return (
            <div key={fase.key} className="rounded-2xl border border-ink-line bg-ink-soft/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium uppercase tracking-wide text-gelo">{fase.label}</span>
                <span className="text-xs text-gelo-dim/60">
                  {itens.filter((i) => i.status === "done").length}/{itens.length}
                </span>
              </div>
              {itens.length === 0 ? (
                <p className="py-3 text-center text-xs text-gelo-dim/50">Sem itens.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {itens.map((i) => (
                    <li key={i.id} className="flex items-start gap-2 rounded-lg border border-ink-line bg-ink p-2.5">
                      <form action={updateEstrategiaStatus}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="status" value={PROX[i.status] ?? "todo"} />
                        <input type="hidden" name="clienteId" value={clienteId} />
                        <button className="mt-0.5" aria-label="Avançar status">
                          {i.status === "done" ? (
                            <Check className="h-4 w-4 text-emerald-400" />
                          ) : i.status === "doing" ? (
                            <CircleDot className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-gelo-dim" />
                          )}
                        </button>
                      </form>
                      <span className={`min-w-0 flex-1 text-sm ${i.status === "done" ? "text-gelo-dim line-through" : "text-gelo"}`}>
                        {i.titulo}
                      </span>
                      <form action={deleteEstrategiaItem}>
                        <input type="hidden" name="id" value={i.id} />
                        <input type="hidden" name="clienteId" value={clienteId} />
                        <button className="text-red-300/50 hover:text-red-300" aria-label="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Aba TRÁFEGO ────────────────────────────────────────────────────────────
  const algumConectado =
    metaView.status === "conectado" || googleView.status === "conectado";
  const trafego = algumConectado ? (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { nome: "Meta Ads", v: metaView },
          { nome: "Google Ads", v: googleView },
        ].map(({ nome, v }) => (
          <div key={nome} className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gelo">{nome}</span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                  v.status === "conectado"
                    ? "border-emerald-500/30 text-emerald-200/90"
                    : v.status === "erro"
                      ? "border-red-500/30 text-red-300"
                      : "border-ink-line text-gelo-dim"
                }`}
              >
                {v.status}
              </span>
            </div>
            <div className="mt-2 text-xs text-gelo-dim">
              {v.ultimaSyncLabel ? `Última sync: ${v.ultimaSyncLabel}` : "Ainda não sincronizado"}
            </div>
          </div>
        ))}
      </div>
      <p className="rounded-2xl border border-ink-line bg-ink-soft/20 p-5 text-sm text-gelo-dim">
        Integração conectada. Os painéis de métricas por cliente (investimento,
        leads, CPL, conversões, ROAS) usam estas credenciais e serão exibidos aqui
        conforme as sincronizações forem populando os dados.
      </p>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-14 text-center">
      <Plug className="h-8 w-8 text-gelo-dim" />
      <p className="text-sm text-gelo">Nenhuma integração de anúncios conectada para este cliente.</p>
      <p className="max-w-md text-xs text-gelo-dim">
        Conecte Meta Ads e Google Ads na aba Configurações para ver aqui investimento,
        leads, custo por lead, conversões e ROAS.
      </p>
    </div>
  );

  // ── Aba CONFIGURAÇÕES ──────────────────────────────────────────────────────
  const config = (
    <div className="flex flex-col gap-6">
      <form action={updateCrmCliente} className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
        <input type="hidden" name="id" value={cliente.id} />
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-gelo">Dados do cliente</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1"><span className={lbl}>Responsável</span><input name="nome" defaultValue={cliente.nome} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Empresa</span><input name="empresa" defaultValue={cliente.empresa} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Segmento</span><input name="segmento" defaultValue={cliente.segmento} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>WhatsApp</span><input name="whatsapp" defaultValue={cliente.whatsapp} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Telefone</span><input name="telefone" defaultValue={cliente.telefone} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>E-mail</span><input name="email" type="email" defaultValue={cliente.email} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Endereço</span><input name="endereco" defaultValue={cliente.endereco} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Cidade</span><input name="cidade" defaultValue={cliente.cidade} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Estado</span><input name="estado" defaultValue={cliente.estado} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Site</span><input name="site" defaultValue={cliente.site} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Instagram</span><input name="instagram" defaultValue={cliente.instagram} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Responsável interno</span><input name="responsavelInterno" defaultValue={cliente.responsavelInterno} className={inputCls} /></label>
          <label className="flex flex-col gap-1">
            <span className={lbl}>Status</span>
            <select name="statusCliente" defaultValue={cliente.statusCliente} className={inputCls}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </label>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="flex flex-col gap-1"><span className={lbl}>Observações internas</span><textarea name="observacoes" rows={3} defaultValue={cliente.observacoes} className={inputCls} /></label>
          <label className="flex flex-col gap-1"><span className={lbl}>Próximos passos</span><textarea name="proximosPassos" rows={3} defaultValue={cliente.proximosPassos} className={inputCls} /></label>
        </div>
        <button className="mt-4 rounded-full bg-roxo px-6 py-2.5 text-sm font-medium text-white">Salvar</button>
      </form>

      <div className="flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
          <Plug className="h-4 w-4" /> Integrações
        </h3>
        <IntegracaoForm clienteId={clienteId} plataforma="meta" label="Meta Ads" view={metaView} cryptoOk={cryptoOk} />
        <IntegracaoForm clienteId={clienteId} plataforma="google" label="Google Ads" view={googleView} cryptoOk={cryptoOk} />
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-gelo">Ações administrativas</h3>
        <form action={deleteCrmCliente}>
          <input type="hidden" name="id" value={cliente.id} />
          <button className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-ink px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5" /> Excluir cliente
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/crm/clientes" className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo">
        <ArrowLeft className="h-4 w-4" /> Clientes
      </Link>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl uppercase text-gelo">{cliente.empresa || cliente.nome}</h1>
          <span className="rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
            {STATUS_CLIENTE[cliente.statusCliente] ?? cliente.statusCliente}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gelo-dim">
          {cliente.nome && cliente.nome !== cliente.empresa && <span>{cliente.nome}</span>}
          {cliente.segmento && <span>{cliente.segmento}</span>}
          {(cliente.cidade || cliente.estado) && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[cliente.cidade, cliente.estado].filter(Boolean).join(" / ")}</span>
          )}
          {cliente.responsavelInterno && <span>resp. {cliente.responsavelInterno}</span>}
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gelo-dim">
          {cliente.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{cliente.whatsapp}</span>}
          {cliente.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{cliente.email}</span>}
          {cliente.site && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{cliente.site}</span>}
          {cliente.instagram && <span className="flex items-center gap-1"><Instagram className="h-3 w-3" />{cliente.instagram}</span>}
        </div>
      </div>

      <ClienteTabs
        tabs={[
          { key: "geral", label: "Geral", content: geral },
          { key: "projeto", label: "Projeto", content: projeto },
          { key: "estrategia", label: "Estratégia", content: estrategia },
          { key: "trafego", label: "Tráfego", content: trafego },
          { key: "config", label: "Configurações", content: config },
        ]}
      />
    </div>
  );
}
