import { dbConfigured } from "@/app/lib/db";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { listClientesTrafego, type ClienteTrafego } from "@/app/admin/trafego-actions";
import { TrafegoClient } from "./TrafegoClient";

export const dynamic = "force-dynamic";

// Logo oficial da Boechat (arquivo local, mesma origem — sem CORS na exportação).
const BOECHAT_LOGO = "/logo/boechat-wordmark-dark.png";

export default async function TrafegoPage() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let clientes: ClienteTrafego[] = [];
  try {
    clientes = await listClientesTrafego();
  } catch {
    return <CrmSetupNotice />;
  }

  return <TrafegoClient clientes={clientes} boechatLogo={BOECHAT_LOGO} />;
}
