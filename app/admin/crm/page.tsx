import Link from "next/link";
import { desc } from "drizzle-orm";
import {
  Inbox,
  UsersRound,
  KanbanSquare,
  ListTodo,
  ArrowRight,
} from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import {
  leads,
  crmClientes,
  projetos,
  tarefas,
  demandas,
} from "@/app/lib/db/schema";
import { CrmSetupNotice } from "./CrmSetupNotice";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/app/lib/crm/types";

export const dynamic = "force-dynamic";

function StatCard({
  numero,
  label,
  href,
  icon: Icon,
  accent,
}: {
  numero: number;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-5 transition-colors hover:border-roxo-light/40"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-4xl leading-none text-gelo">{numero}</div>
        <Icon className="h-5 w-5 shrink-0 text-gelo-dim transition-colors group-hover:text-roxo-light" />
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs uppercase tracking-wide text-gelo-dim">
        {label}
        <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}

export default async function CrmDashboard() {
  if (!dbConfigured()) return <CrmSetupNotice />;

  let leadsRows: (typeof leads.$inferSelect)[] = [];
  let clientesCount = 0;
  let projetosCount = 0;
  let tarefasAbertas = 0;
  let demandasAbertas = 0;
  let erro = false;

  try {
    const db = getDb();
    const [ls, cs, ps, ts, ds] = await Promise.all([
      db.select().from(leads).orderBy(desc(leads.criadoEm)),
      db.select().from(crmClientes),
      db.select().from(projetos),
      db.select().from(tarefas),
      db.select().from(demandas),
    ]);
    leadsRows = ls;
    clientesCount = cs.length;
    projetosCount = ps.length;
    tarefasAbertas = ts.filter((t) => t.status !== "done").length;
    demandasAbertas = ds.filter((d) => d.status !== "concluido").length;
  } catch {
    erro = true;
  }

  if (erro) return <CrmSetupNotice />;

  const leadsAbertos = leadsRows.filter(
    (l) => l.status !== "ganho" && l.status !== "perdido",
  ).length;

  const porStatus = LEAD_STATUS_LABEL;
  const ultimosLeads = leadsRows.slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl uppercase">Dashboard</h1>
        <p className="mt-1 text-sm text-gelo-dim">
          Visão geral da operação da Boechat.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard numero={leadsAbertos} label="Leads abertos" href="/admin/crm/leads" icon={Inbox} accent="bg-sky-400" />
        <StatCard numero={clientesCount} label="Clientes" href="/admin/crm/clientes" icon={UsersRound} accent="bg-emerald-400" />
        <StatCard numero={projetosCount} label="Projetos" href="/admin/crm/projetos" icon={KanbanSquare} accent="bg-roxo" />
        <StatCard numero={tarefasAbertas + demandasAbertas} label="Em aberto" href="/admin/crm/demandas" icon={ListTodo} accent="bg-yellow-400" />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gelo">
            Últimos leads
          </h2>
          <Link href="/admin/crm/leads" className="text-xs text-roxo-light hover:underline">
            Ver todos
          </Link>
        </div>
        {ultimosLeads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-8 text-center text-sm text-gelo-dim">
            Nenhum lead ainda.{" "}
            <Link href="/admin/crm/leads/novo" className="text-roxo-light underline">
              Cadastra o primeiro
            </Link>
            .
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {ultimosLeads.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-line bg-ink-soft/30 p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium text-gelo">{l.nome}</div>
                  <div className="mt-0.5 text-xs text-gelo-dim">
                    {l.empresa || "sem empresa"}
                    {l.whatsapp ? ` · ${l.whatsapp}` : ""}
                  </div>
                </div>
                <span className="rounded-full border border-ink-line px-3 py-1 text-xs text-gelo-dim">
                  {porStatus[l.status as LeadStatus] ?? l.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
