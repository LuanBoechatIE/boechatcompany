import Link from "next/link";
import { desc } from "drizzle-orm";
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

export default async function Dashboard() {
  if (!dbConfigured()) return <SetupNotice />;

  let lista: {
    id: number;
    nome: string;
    token: string;
    status: ClienteStatus;
    presetNome: string;
  }[] = [];
  let erro = false;

  try {
    const db = getDb();
    const [cs, ps] = await Promise.all([
      db.select().from(clientes).orderBy(desc(clientes.criadoEm)),
      db.select().from(presets),
    ]);
    const presetNome = new Map(ps.map((p) => [p.id, p.nome]));
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

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Onboardings</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Cria o cliente, manda o link, acompanha a resposta.
          </p>
        </div>
        <Link
          href="/onboarding/admin/clientes/novo"
          className="rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white"
        >
          + Novo cliente
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhum cliente ainda. Clica em <strong>Novo cliente</strong> pra
          começar. Antes, crie ao menos um{" "}
          <Link href="/onboarding/admin/presets" className="text-roxo-light underline">
            preset de oferta
          </Link>
          .
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <div className="min-w-0">
                <Link
                  href={`/onboarding/admin/clientes/${c.id}`}
                  className="font-medium hover:text-roxo-light"
                >
                  {c.nome}
                </Link>
                <div className="mt-1 text-xs text-gelo-dim">{c.presetNome}</div>
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
  );
}
