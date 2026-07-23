import Link from "next/link";
import { Pencil, Plus, Trash2, Users, MapPin } from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { getVagas } from "@/app/lib/recrutamento/data";
import { VAGA_STATUS_LABEL, MODELO_LABEL } from "@/app/lib/recrutamento/types";
import { SetupNotice } from "../../../SetupNotice";
import { CopyLink } from "../../../CopyLink";
import { deleteVaga } from "../../../recrutamento-actions";

export const dynamic = "force-dynamic";

const STATUS_COR: Record<string, string> = {
  aberta: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  fechada: "border-red-500/30 bg-red-500/10 text-red-300",
  rascunho: "border-ink-line bg-ink text-gelo-dim",
};

export default async function VagasPage() {
  if (!dbConfigured()) return <SetupNotice />;

  let vagas: Awaited<ReturnType<typeof getVagas>> = [];
  let erro = false;
  try {
    vagas = await getVagas();
  } catch {
    erro = true;
  }
  if (erro) return <SetupNotice tabelas />;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Vagas</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            Cada vaga gera um link público de candidatura.
          </p>
        </div>
        <Link
          href="/admin/equipe/recrutamento/vagas/novo"
          className="flex items-center gap-2 rounded-full bg-roxo px-6 py-3 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Nova vaga
        </Link>
      </div>

      {vagas.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhuma vaga ainda. Clica em <strong className="text-gelo">+ Nova vaga</strong> pra criar a primeira.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vagas.map((v) => (
            <div key={v.id} className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-gelo">{v.nome}</h3>
                  {v.cargoNome && <p className="text-xs text-gelo-dim">{v.cargoNome}</p>}
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_COR[v.status]}`}>
                  {VAGA_STATUS_LABEL[v.status]}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gelo-dim">
                <span>{MODELO_LABEL[v.modelo]}</span>
                {v.cidade && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.cidade}</span>
                )}
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.totalCandidaturas}</span>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <Link
                  href={`/admin/equipe/recrutamento/vagas/${v.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-ink-line bg-ink px-3 py-1.5 text-xs text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Link>
                <CopyLink token={v.token} basePath="/vagas" compact />
                <form action={deleteVaga} className="ml-auto">
                  <input type="hidden" name="id" value={v.id} />
                  <button className="rounded-lg border border-ink-line bg-ink p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300" aria-label="Excluir vaga">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
