import { dbConfigured } from "@/app/lib/db";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { temPermissao } from "@/app/lib/perms-guard";
import { PontoTable } from "./PontoTable";

export const dynamic = "force-dynamic";

export default async function PontoPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;
  if (!(await temPermissao("time_tracking.view_team"))) return <SemPermissao area="o Ponto da equipe" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl uppercase text-gelo">Ponto da equipe</h1>
        <p className="text-sm text-gelo-dim">Quando cada funcionário ativou e encerrou o ponto, e quanto tempo ficou ativo.</p>
      </div>
      <PontoTable />
    </div>
  );
}
