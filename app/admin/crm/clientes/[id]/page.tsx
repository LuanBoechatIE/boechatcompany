import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import {
  ArrowLeft,
  Trash2,
  Check,
  KanbanSquare,
  ListTodo,
  Plus,
} from "lucide-react";
import { getDb } from "@/app/lib/db";
import {
  crmClientes,
  contratos,
  pagamentos,
  projetos,
  demandas,
} from "@/app/lib/db/schema";
import { formatBRL, formatDate } from "@/app/lib/crm/format";
import { deleteCrmCliente } from "../../../crm-actions";
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

  const [contratosRows, pagamentosRows, projetosRows, demandasRows] = await Promise.all([
    db.select().from(contratos).where(eq(contratos.clienteId, clienteId)).orderBy(desc(contratos.criadoEm)),
    db.select().from(pagamentos).where(eq(pagamentos.clienteId, clienteId)).orderBy(desc(pagamentos.vencimento)),
    db.select().from(projetos).where(eq(projetos.clienteId, clienteId)),
    db.select().from(demandas).where(eq(demandas.clienteId, clienteId)),
  ]);

  const now = new Date();
  const pagamentosPorContrato = new Map<number, typeof pagamentosRows>();
  for (const p of pagamentosRows) {
    const arr = pagamentosPorContrato.get(p.contratoId) ?? [];
    arr.push(p);
    pagamentosPorContrato.set(p.contratoId, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/crm/clientes"
        className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">{cliente.nome}</h1>
          {cliente.empresa && <p className="mt-1 text-sm text-gelo-dim">{cliente.empresa}</p>}
        </div>
        <form action={deleteCrmCliente}>
          <input type="hidden" name="id" value={cliente.id} />
          <button className="flex items-center gap-1.5 text-sm text-red-300/70 hover:text-red-300">
            <Trash2 className="h-3.5 w-3.5" />
            Excluir cliente
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Contratos */}
          <div>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">
              Contratos
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
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${CONTRATO_STATUS_CLS[c.status] ?? ""}`}
                        >
                          {CONTRATO_STATUS_LABEL[c.status] ?? c.status}
                        </span>
                        <form action={updateContratoStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="clienteId" value={clienteId} />
                          <input
                            type="hidden"
                            name="status"
                            value={c.status === "ativo" ? "pausado" : "ativo"}
                          />
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
                          <button
                            className="rounded-lg border border-ink-line p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300"
                            aria-label="Excluir contrato"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Pagamentos do contrato */}
                    {pgs.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-1.5 border-t border-ink-line/60 pt-3">
                        {pgs.map((p) => {
                          const atrasado = p.status === "pendente" && p.vencimento < now;
                          return (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-gelo-dim">
                                {formatBRL(Number(p.valor))} · vence {formatDate(p.vencimento)}
                              </span>
                              <span className="flex items-center gap-2">
                                <span
                                  className={
                                    p.status === "pago"
                                      ? "text-emerald-300"
                                      : atrasado
                                        ? "text-red-300"
                                        : "text-gelo-dim"
                                  }
                                >
                                  {atrasado ? "Atrasado" : PAGAMENTO_STATUS_LABEL[p.status] ?? p.status}
                                </span>
                                {p.status !== "pago" && (
                                  <form action={markPagamentoPago}>
                                    <input type="hidden" name="id" value={p.id} />
                                    <input type="hidden" name="clienteId" value={clienteId} />
                                    <button
                                      className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-2 py-0.5 text-emerald-200/90 hover:bg-emerald-500/10"
                                      aria-label="Marcar como pago"
                                    >
                                      <Check className="h-3 w-3" />
                                      Marcar pago
                                    </button>
                                  </form>
                                )}
                                <form action={deletePagamento}>
                                  <input type="hidden" name="id" value={p.id} />
                                  <input type="hidden" name="clienteId" value={clienteId} />
                                  <button
                                    className="text-gelo-dim/60 hover:text-red-300"
                                    aria-label="Excluir pagamento"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </form>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Novo pagamento avulso */}
                    <details className="mt-3 border-t border-ink-line/60 pt-3">
                      <summary className="cursor-pointer text-[11px] text-roxo-light">
                        + Registrar pagamento avulso
                      </summary>
                      <form
                        action={createPagamento}
                        className="mt-2 flex flex-wrap items-end gap-2"
                      >
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

            {/* Novo contrato */}
            <details className="mt-4 rounded-2xl border border-dashed border-ink-line bg-ink-soft/10 p-4">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm text-roxo-light">
                <Plus className="h-3.5 w-3.5" />
                Novo contrato
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
        </div>

        {/* Projetos e demandas ligados */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
              <KanbanSquare className="h-4 w-4 text-roxo-light" />
              Projetos
            </h2>
            {projetosRows.length === 0 ? (
              <p className="text-xs text-gelo-dim">Nenhum projeto ligado.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {projetosRows.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/crm/projetos/${p.id}`}
                      className="block rounded-xl border border-ink-line bg-ink-soft/30 p-3 text-xs text-gelo hover:border-roxo-light/40"
                    >
                      {p.nome}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-gelo">
              <ListTodo className="h-4 w-4 text-roxo-light" />
              Demandas
            </h2>
            {demandasRows.length === 0 ? (
              <p className="text-xs text-gelo-dim">Nenhuma demanda ligada.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {demandasRows.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-xl border border-ink-line bg-ink-soft/30 p-3 text-xs text-gelo"
                  >
                    {d.titulo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
