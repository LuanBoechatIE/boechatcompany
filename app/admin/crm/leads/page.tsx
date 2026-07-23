import { Search } from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { getLeadsData } from "@/app/lib/crm/leads-data";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { LeadsWorkspace } from "./LeadsWorkspace";
import { LeadsToolbar } from "./LeadsToolbar";
import {
  LEAD_STAGES,
  ORIGENS_LEAD,
  SERVICOS,
  RESPONSAVEIS,
} from "@/app/lib/crm/types";

export const dynamic = "force-dynamic";

const inputCls =
  "rounded-xl border border-ink-line bg-ink px-3 py-2 text-sm text-gelo-dim outline-none focus:border-roxo-light/50";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const sp = await searchParams;
  const fResp = sp.responsavel ?? "";
  const fOrigem = sp.origem ?? "";
  const fServico = sp.servico ?? "";
  const fStatus = sp.status ?? "";

  let data: Awaited<ReturnType<typeof getLeadsData>>;
  try {
    data = await getLeadsData(sp);
  } catch {
    return <CrmSetupNotice />;
  }

  const { leads: dtos, atividadesPorLead, metrics, fila } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Central comercial</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Prospecção, follow-up e pipeline num só lugar.
          </p>
        </div>
        <LeadsToolbar leads={dtos} />
      </div>

      {/* Busca e filtros */}
      <form method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gelo-dim" />
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por nome, empresa, contato, e-mail..."
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <select name="responsavel" defaultValue={fResp} className={inputCls}>
          <option value="">Responsável</option>
          {RESPONSAVEIS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select name="origem" defaultValue={fOrigem} className={inputCls}>
          <option value="">Origem</option>
          {ORIGENS_LEAD.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <select name="servico" defaultValue={fServico} className={inputCls}>
          <option value="">Serviço</option>
          {SERVICOS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select name="status" defaultValue={fStatus} className={inputCls}>
          <option value="">Etapa</option>
          {LEAD_STAGES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <button className="rounded-xl bg-roxo px-4 py-2 text-sm font-medium text-white">
          Filtrar
        </button>
        {(sp.q || fResp || fOrigem || fServico || fStatus) && (
          <a href="/admin/crm/leads" className="text-sm text-gelo-dim hover:text-gelo">
            Limpar
          </a>
        )}
      </form>

      <LeadsWorkspace
        leads={dtos}
        atividadesPorLead={atividadesPorLead}
        metrics={metrics}
        fila={fila}
      />
    </div>
  );
}
