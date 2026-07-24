import { dbConfigured } from "@/app/lib/db";
import { getLeadsData } from "@/app/lib/crm/leads-data";
import { getSessaoAtual } from "@/app/lib/sessao";
import { listUsuariosAtivos } from "../../crm-actions";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { temPermissao } from "@/app/lib/perms-guard";
import { LeadsWorkspace } from "./LeadsWorkspace";
import { LeadsToolbar } from "./LeadsToolbar";
import { LeadsFilterBar } from "./LeadsFilterBar";
import { VendedorFiltro } from "./VendedorFiltro";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;
  if (!(await temPermissao("leads.visualizar"))) return <SemPermissao area="Leads" />;

  const sp = await searchParams;
  const sessao = await getSessaoAtual();

  // Escopo de dados: Vendedor sempre trava no próprio (mesmo se manipular a
  // URL); Diretor/Dono respeita ?vendedor=<id> (vazio/"todos" = consolidado).
  const vendedorParam = sp.vendedor;
  const escopoUsuarioId = !sessao
    ? undefined
    : sessao.podeVerEquipe
      ? vendedorParam
        ? Number(vendedorParam)
        : null
      : sessao.id;

  const usuariosEquipe = sessao?.podeVerEquipe ? await listUsuariosAtivos() : [];

  let data: Awaited<ReturnType<typeof getLeadsData>>;
  try {
    data = await getLeadsData(sp, sessao?.username, escopoUsuarioId);
  } catch {
    return <CrmSetupNotice />;
  }

  const {
    leads: dtos,
    atividadesPorLead,
    checklistPorLead,
    arquivosPorLead,
    metrics,
    fila,
    filtrosSalvos,
    filtros,
    metas,
  } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Central comercial</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Prospecção, follow-up e pipeline num só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessao?.podeVerEquipe && (
            <VendedorFiltro usuarios={usuariosEquipe} atual={vendedorParam ?? ""} />
          )}
          <LeadsToolbar leads={dtos} />
        </div>
      </div>

      <LeadsFilterBar filtros={filtros as Record<string, string>} filtrosSalvos={filtrosSalvos} />

      <LeadsWorkspace
        leads={dtos}
        atividadesPorLead={atividadesPorLead}
        checklistPorLead={checklistPorLead}
        arquivosPorLead={arquivosPorLead}
        metrics={metrics}
        fila={fila}
        metas={metas}
        podeReatribuir={sessao?.podeReatribuir ?? false}
      />
    </div>
  );
}
