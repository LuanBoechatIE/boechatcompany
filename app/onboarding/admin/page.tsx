import Link from "next/link";
import { desc } from "drizzle-orm";
import {
  ClipboardList,
  FilePlus2,
  LayoutTemplate,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { dbConfigured, getDb } from "@/app/lib/db";
import { clientes, presets } from "@/app/lib/db/schema";
import { STATUS_LABEL, type ClienteStatus } from "@/app/lib/onboarding/types";
import { CopyLink } from "./CopyLink";
import { SetupNotice } from "./SetupNotice";

export const dynamic = "force-dynamic";

const badgeCls: Record<ClienteStatus, string> = {
  criado: "bg-yellow-500/10 text-yellow-200/90 border-yellow-500/30",
  respondido: "bg-emerald-500/10 text-emerald-200/90 border-emerald-500/30",
  reaberto: "bg-roxo/15 text-roxo-light border-roxo/40",
};

const dotCls: Record<ClienteStatus, string> = {
  criado: "bg-yellow-400",
  respondido: "bg-emerald-400",
  reaberto: "bg-roxo-light",
};

function StatCard({
  numero,
  label,
  accent,
  icon: Icon,
}: {
  numero: number;
  label: string;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-line bg-ink-soft/40 p-5 transition-colors hover:border-roxo-light/30">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="font-display text-4xl leading-none text-gelo">{numero}</div>
        <Icon className="h-5 w-5 shrink-0 text-gelo-dim transition-colors group-hover:text-roxo-light" />
      </div>
      <div className="mt-2 text-xs uppercase tracking-wide text-gelo-dim">{label}</div>
    </div>
  );
}

export default async function Dashboard() {
  if (!dbConfigured()) return <SetupNotice />;

  let lista: {
    id: number;
    nome: string;
    token: string;
    status: ClienteStatus;
    presetNome: string;
  }[] = [];
  let presetsCount = 0;
  let erro = false;

  try {
    const db = getDb();
    const [cs, ps] = await Promise.all([
      db.select().from(clientes).orderBy(desc(clientes.criadoEm)),
      db.select().from(presets),
    ]);
    const presetNome = new Map(ps.map((p) => [p.id, p.nome]));
    presetsCount = ps.length;
    lista = cs.map((c) => ({
      id: c.id,
      nome: c.nome,
      token: c.token,
      status: c.status as ClienteStatus,
      presetNome: presetNome.get(c.presetId) ?? "(preset removido)",
    }));
  } catch {
    erro = true;
  }

  if (erro) return <SetupNotice tabelas />;

  const total = lista.length;
  const respondidos = lista.filter((c) => c.status === "respondido").length;
  const aguardando = total - respondidos;

  return (
    <div className="flex flex-col gap-10">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Painel</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Visão geral dos onboardings da Boechat.
          </p>
        </div>
        <Link
          href="/onboarding/admin/clientes/novo"
          className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
        >
          <UserRoundPlus className="h-4 w-4" />
          Novo cliente
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard numero={total} label="Clientes" accent="bg-gelo/40" icon={Users} />
        <StatCard numero={aguardando} label="Aguardando" accent="bg-yellow-400" icon={ClipboardList} />
        <StatCard numero={respondidos} label="Respondidos" accent="bg-emerald-400" icon={Users} />
        <StatCard numero={presetsCount} label="Presets" accent="bg-roxo" icon={LayoutTemplate} />
      </div>

      {/* Ações rápidas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/onboarding/admin/clientes/novo"
          className="group rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/50"
        >
          <UserRoundPlus className="h-6 w-6 text-roxo-light transition-transform group-hover:scale-110" />
          <div className="mt-3 font-medium text-gelo">Novo cliente</div>
          <div className="mt-1 text-xs text-gelo-dim">
            Cria e gera o link de onboarding.
          </div>
        </Link>
        <Link
          href="/onboarding/admin/presets"
          className="group rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/50"
        >
          <LayoutTemplate className="h-6 w-6 text-roxo-light transition-transform group-hover:scale-110" />
          <div className="mt-3 font-medium text-gelo">Presets de oferta</div>
          <div className="mt-1 text-xs text-gelo-dim">
            Os modelos de onboarding por oferta.
          </div>
        </Link>
        <Link
          href="/onboarding/admin/presets/novo"
          className="group rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/50"
        >
          <FilePlus2 className="h-6 w-6 text-roxo-light transition-transform group-hover:scale-110" />
          <div className="mt-3 font-medium text-gelo">Novo preset</div>
          <div className="mt-1 text-xs text-gelo-dim">
            Monta um onboarding do zero.
          </div>
        </Link>
      </div>

      {/* Lista de clientes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-gelo">
            Clientes
          </h2>
          {total > 0 && (
            <span className="text-xs text-gelo-dim">
              {aguardando} aguardando · {respondidos} respondido
              {respondidos === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-gelo-dim" />
            <p className="mt-4 text-sm text-gelo-dim">
              Nenhum cliente ainda. O fluxo é simples:
            </p>
            <ol className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-left text-sm text-gelo-dim">
              <li>
                <strong className="text-gelo">1.</strong> Tenha um{" "}
                <Link href="/onboarding/admin/presets" className="text-roxo-light underline">
                  preset de oferta
                </Link>{" "}
                (clica em &quot;Criar presets padrão&quot; lá).
              </li>
              <li>
                <strong className="text-gelo">2.</strong>{" "}
                <Link
                  href="/onboarding/admin/clientes/novo"
                  className="text-roxo-light underline"
                >
                  Cria o cliente
                </Link>{" "}
                e escolhe a oferta.
              </li>
              <li>
                <strong className="text-gelo">3.</strong> Copia o link e manda pro
                cliente responder.
              </li>
            </ol>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {lista.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-line bg-ink-soft/30 p-5 transition-colors hover:border-roxo-light/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotCls[c.status]}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/onboarding/admin/clientes/${c.id}`}
                      className="font-medium hover:text-roxo-light"
                    >
                      {c.nome}
                    </Link>
                    <div className="mt-1 text-xs text-gelo-dim">{c.presetNome}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${badgeCls[c.status]}`}
                  >
                    {STATUS_LABEL[c.status]}
                  </span>
                  <CopyLink token={c.token} compact />
                  <Link
                    href={`/onboarding/admin/clientes/${c.id}`}
                    className="rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
