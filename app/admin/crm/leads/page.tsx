import Link from "next/link";
import { desc } from "drizzle-orm";
import { Plus, UserRoundCheck, Trash2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { leads } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import {
  LEAD_STATUS,
  type LeadStatus,
} from "@/app/lib/crm/types";
import { updateLeadStatus, convertLeadToClient, deleteLead } from "../../crm-actions";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let lista: (typeof leads.$inferSelect)[] = [];
  let erro = false;
  try {
    lista = await getDb().select().from(leads).orderBy(desc(leads.criadoEm));
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  const dotOf = (s: string) =>
    LEAD_STATUS.find((x) => x.key === s)?.dot ?? "bg-gelo/40";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Leads</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Prospecção. Move o status conforme evolui e converte em cliente quando fecha.
          </p>
        </div>
        <Link
          href="/admin/crm/leads/novo"
          className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo lead
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center text-sm text-gelo-dim">
          Nenhum lead ainda.{" "}
          <Link href="/admin/crm/leads/novo" className="text-roxo-light underline">
            Cadastra o primeiro
          </Link>
          .
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotOf(l.status)}`} aria-hidden />
                <div className="min-w-0">
                  <div className="font-medium text-gelo">{l.nome}</div>
                  <div className="mt-0.5 truncate text-xs text-gelo-dim">
                    {[l.empresa, l.setor, l.faturamento].filter(Boolean).join(" · ") || "sem detalhes"}
                    {l.whatsapp ? ` · ${l.whatsapp}` : ""}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <form action={updateLeadStatus}>
                  <input type="hidden" name="id" value={l.id} />
                  <select
                    name="status"
                    defaultValue={l.status}
                    className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim outline-none focus:border-roxo-light/50"
                  >
                    {LEAD_STATUS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button className="ml-1 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo">
                    Salvar
                  </button>
                </form>

                {(l.status as LeadStatus) !== "ganho" && (
                  <form action={convertLeadToClient}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200/90 hover:bg-emerald-500/20">
                      <UserRoundCheck className="h-3.5 w-3.5" />
                      Converter
                    </button>
                  </form>
                )}

                <form action={deleteLead}>
                  <input type="hidden" name="id" value={l.id} />
                  <button
                    className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-red-300/80 hover:border-red-500/30 hover:text-red-300"
                    aria-label="Excluir lead"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
