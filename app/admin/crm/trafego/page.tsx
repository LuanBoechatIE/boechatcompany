import { dbConfigured } from "@/app/lib/db";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { SemPermissao } from "../SemPermissao";
import { temPermissao } from "@/app/lib/perms-guard";
import { listClientesTrafego, type ClienteTrafego } from "@/app/admin/trafego-actions";
import { TrafegoClient } from "./TrafegoClient";

export const dynamic = "force-dynamic";

// Logo oficial da Boechat (arquivo local, mesma origem — sem CORS na exportação).
const BOECHAT_LOGO = "/logo/boechat-wordmark-dark.png";

export default async function TrafegoPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;
  if (!(await temPermissao("trafego.visualizar"))) return <SemPermissao area="Tráfego" />;

  let clientes: ClienteTrafego[] = [];
  try {
    clientes = await listClientesTrafego();
  } catch {
    return <CrmSetupNotice />;
  }

  return <TrafegoClient clientes={clientes} boechatLogo={BOECHAT_LOGO} />;
}
