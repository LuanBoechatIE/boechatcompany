import { asc } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { crmClientes, projetos } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { getConexaoView, getCalendarItems } from "@/app/admin/calendario-actions";
import { CalendarioClient } from "./CalendarioClient";

export const dynamic = "force-dynamic";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const { google } = await searchParams;

  // Janela inicial: mês atual (com margem pra grade de 6 semanas).
  const hoje = new Date();
  const from = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 20);
  const to = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 15);

  try {
    const db = getDb();
    const [conexao, itens, clientes, projs] = await Promise.all([
      getConexaoView(),
      getCalendarItems(from.toISOString(), to.toISOString()),
      db.select({ id: crmClientes.id, nome: crmClientes.nome }).from(crmClientes).orderBy(asc(crmClientes.nome)),
      db.select({ id: projetos.id, nome: projetos.nome }).from(projetos).orderBy(asc(projetos.nome)),
    ]);

    return (
      <CalendarioClient
        itensIniciais={itens}
        conexao={conexao}
        clientes={clientes}
        projetos={projs}
        googleMsg={google}
      />
    );
  } catch {
    return <CrmSetupNotice />;
  }
}
