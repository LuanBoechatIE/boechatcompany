import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Layers, UsersRound, Building2 } from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { demandas, crmClientes } from "@/app/lib/db/schema";
import { CrmSetupNotice } from "../CrmSetupNotice";
import { DemandasBoard } from "./DemandasBoard";
import { NovaDemanda } from "./NovaDemanda";
import type { KanbanItem } from "@/app/components/admin/kanban/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function DemandasPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  if (!dbConfigured()) return <CrmSetupNotice />;

  const { cliente: filtroRaw } = await searchParams;
  const filtro = filtroRaw ?? "todas"; // todas | boechat | <id>

  let rows: (typeof demandas.$inferSelect)[] = [];
  let clientes: { id: number; nome: string }[] = [];
  let erro = false;
  try {
    const db = getDb();
    const [ds, cs] = await Promise.all([
      db.select().from(demandas).orderBy(asc(demandas.ordem)),
      db
        .select({ id: crmClientes.id, nome: crmClientes.nome })
        .from(crmClientes)
        .orderBy(desc(crmClientes.criadoEm)),
    ]);
    rows = ds;
    clientes = cs;
  } catch {
    erro = true;
  }
  if (erro) return <CrmSetupNotice />;

  const nomeCliente = new Map(clientes.map((c) => [c.id, c.nome]));

  // Aplica o filtro selecionado. "boechat" = demandas internas da agência
  // (sem cliente vinculado).
  const filtradas = rows.filter((d) => {
    if (filtro === "todas") return true;
    if (filtro === "boechat") return d.clienteId == null;
    return String(d.clienteId) === filtro;
  });

  const itens: KanbanItem[] = filtradas.map((d) => ({
    id: d.id,
    titulo: d.titulo,
    descricao: d.descricao,
    responsavel: d.responsavel,
    prioridade: d.prioridade,
    status: d.status,
    prazo: d.prazo
      ? new Date(d.prazo).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : undefined,
    // Na visão "Todas", mostra a qual cliente pertence (ou Boechat).
    subtitulo:
      filtro === "todas"
        ? d.clienteId
          ? (nomeCliente.get(d.clienteId) ?? undefined)
          : "Boechat"
        : undefined,
  }));

  // Opções do card de filtro, com contagem.
  const contarBoechat = rows.filter((d) => d.clienteId == null).length;
  const opcoes: {
    key: string;
    label: string;
    count: number;
    icon: "todas" | "boechat" | "cliente";
  }[] = [
    { key: "todas", label: "Todas", count: rows.length, icon: "todas" },
    { key: "boechat", label: "Boechat", count: contarBoechat, icon: "boechat" },
    ...clientes.map((c) => ({
      key: String(c.id),
      label: c.nome,
      count: rows.filter((d) => d.clienteId === c.id).length,
      icon: "cliente" as const,
    })),
  ];

  const clienteInicial =
    filtro !== "todas" && filtro !== "boechat" ? filtro : "";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Demandas</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Kanban da agência. Filtra por Geral ou por cliente e arrasta os cards.
          </p>
        </div>
        <NovaDemanda clientes={clientes} clienteInicial={clienteInicial} />
      </div>

      {/* Card de filtro: Todas / Geral / clientes */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-ink-line bg-ink-soft/30 p-3">
        {opcoes.map((op) => {
          const ativo = op.key === filtro;
          return (
            <Link
              key={op.key}
              href={`/admin/crm/demandas?cliente=${op.key}`}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                ativo
                  ? "border-roxo/40 bg-roxo/10 font-medium text-gelo"
                  : "border-ink-line text-gelo-dim hover:border-roxo-light/40 hover:text-gelo"
              }`}
            >
              {op.icon === "todas" ? (
                <Layers className="h-3.5 w-3.5" />
              ) : op.icon === "boechat" ? (
                <Building2 className="h-3.5 w-3.5" />
              ) : (
                <UsersRound className="h-3.5 w-3.5" />
              )}
              {op.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  ativo ? "bg-roxo/30 text-gelo" : "bg-ink text-gelo-dim/70"
                }`}
              >
                {op.count}
              </span>
            </Link>
          );
        })}
      </div>

      <DemandasBoard items={itens} />
    </div>
  );
}
