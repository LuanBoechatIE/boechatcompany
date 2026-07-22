import { dbConfigured } from "@/app/lib/db";
import { CrmSetupNotice } from "../crm/CrmSetupNotice";
import { getPerfilAtual } from "../perfil-actions";
import { ConfiguracoesTabs } from "./ConfiguracoesTabs";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const perfil = await getPerfilAtual();
  if (!perfil) return <CrmSetupNotice />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">Configurações</h1>
        <p className="mt-1 text-sm text-gelo-dim">Seu perfil, segurança e preferências.</p>
      </div>
      <ConfiguracoesTabs perfil={perfil} />
    </div>
  );
}
