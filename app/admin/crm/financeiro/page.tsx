import Link from "next/link";
import { desc, eq, and, ne } from "drizzle-orm";
import { Check, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { contratos, pagamentos, despesas, crmClientes } from "@/app/lib/db/schema";
import { formatBRL, formatDate } from "@/app/lib/crm/format";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { temPermissao } from "@/app/lib/perms-guard";
import {
  gerarCobrancasDoMes,
  markPagamentoPago,
  createDespesa,
  deleteDespesa,
} from "../../financeiro-actions";

export const dynamic = "force-dynamic";

const inputCls =
  "w-full rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ geradas?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;
  if (!(await temPermissao("financeiro.visualizar"))) return <SemPermissao area="o Financeiro" />;

  const { geradas } = await searchParams;
  const db = getDb();
  const now = new Date();

  const [pagamentosRows, despesasRows, clientesRows, contratosAtivos] = await Promise.all([
    db.select().from(pagamentos).where(ne(pagamentos.status, "pago")).orderBy(pagamentos.vencimento),
    db.select().from(despesas).orderBy(desc(despesas.data)),
    db.select().from(crmClientes),
    db.select().from(contratos).where(and(eq(contratos.status, "ativo"), ne(contratos.valorRecorrente, "0.00"))),
  ]);

  const clienteNome = new Map(clientesRows.map((c) => [c.id, c.nome]));
  const cobrancasVencidas = contratosAtivos.filter(
    (c) => c.proximaCobranca && c.proximaCobranca <= now,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Financeiro</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Pagamentos, cobranças recorrentes e despesas.
          </p>
        </div>
        <form action={gerarCobrancasDoMes}>
          <button className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90">
            <RefreshCw className="h-4 w-4" />
            Gerar cobranças do mês
            {cobrancasVencidas > 0 && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {cobrancasVencidas}
              </span>
            )}
          </button>
        </form>
      </div>

      {geradas !== undefined && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200/90">
          <CheckCircle2 className="h-4 w-4" />
          {Number(geradas) > 0
            ? `${geradas} cobrança${Number(geradas) === 1 ? "" : "s"} gerada${Number(geradas) === 1 ? "" : "s"}.`
            : "Nenhuma cobrança vencida agora. Tudo em dia."}
        </div>
      )}

      {/* Pagamentos pendentes/atrasados */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">
          Pagamentos em aberto
        </h2>
        {pagamentosRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-6 text-center text-sm text-gelo-dim">
            Nenhum pagamento em aberto.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pagamentosRows.map((p) => {
              const atrasado = p.vencimento < now;
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft/30 p-4"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/crm/clientes/${p.clienteId}`}
                      className="font-medium text-gelo hover:text-roxo-light"
                    >
                      {clienteNome.get(p.clienteId) ?? "Cliente"}
                    </Link>
                    <div className="mt-0.5 text-xs text-gelo-dim">
                      {formatBRL(Number(p.valor))} · vence {formatDate(p.vencimento)}
                      {p.tipo === "recorrente" ? " · recorrente" : " · implementação"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${atrasado ? "text-red-300" : "text-gelo-dim"}`}>
                      {atrasado ? "Atrasado" : "Pendente"}
                    </span>
                    <form action={markPagamentoPago}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="clienteId" value={p.clienteId} />
                      <button className="flex items-center gap-1 rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-200/90 hover:bg-emerald-500/10">
                        <Check className="h-3 w-3" />
                        Marcar pago
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Despesas */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gelo">Despesas</h2>

        <details className="mb-4 rounded-2xl border border-dashed border-ink-line bg-ink-soft/10 p-4">
          <summary className="cursor-pointer text-sm text-roxo-light">+ Nova despesa</summary>
          <form action={createDespesa} className="mt-3 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Descrição *</span>
              <input name="descricao" required className={`${inputCls} w-48`} placeholder="Ex.: Ferramenta X" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Valor *</span>
              <input name="valor" type="number" step="0.01" required className={`${inputCls} w-28`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Categoria</span>
              <input name="categoria" className={`${inputCls} w-32`} placeholder="geral" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-gelo-dim">Data</span>
              <input name="data" type="date" className={inputCls} />
            </label>
            <label className="flex items-center gap-2 pb-2.5 text-xs text-gelo-dim">
              <input name="recorrente" type="checkbox" className="h-3.5 w-3.5" />
              Recorrente
            </label>
            <button className="rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white">
              Adicionar
            </button>
          </form>
        </details>

        {despesasRows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-6 text-center text-sm text-gelo-dim">
            Nenhuma despesa registrada.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {despesasRows.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft/30 p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gelo">{d.descricao}</div>
                  <div className="mt-0.5 text-xs text-gelo-dim">
                    {formatBRL(Number(d.valor))} · {d.categoria} · {formatDate(d.data)}
                    {d.recorrente ? " · recorrente" : ""}
                  </div>
                </div>
                <form action={deleteDespesa}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    className="rounded-lg border border-ink-line p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300"
                    aria-label="Excluir despesa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
