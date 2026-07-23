import Link from "next/link";
import { MapPin, Briefcase, Trash2 } from "lucide-react";
import { dbConfigured } from "@/app/lib/db";
import { getCandidaturas, getVagaPorId } from "@/app/lib/recrutamento/data";
import { CANDIDATURA_STATUS_LABEL } from "@/app/lib/recrutamento/types";
import { SetupNotice } from "../../../SetupNotice";
import { ConfirmSubmitButton } from "../../../ConfirmSubmitButton";
import { deleteCandidatura } from "../../../recrutamento-actions";

export const dynamic = "force-dynamic";

const STATUS_COR: Record<string, string> = {
  recebida: "border-ink-line bg-ink text-gelo-dim",
  contratado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejeitada: "border-red-500/30 bg-red-500/10 text-red-300",
};

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ vaga?: string }>;
}) {
  if (!dbConfigured()) return <SetupNotice />;

  const { vaga: vagaParam } = await searchParams;
  const filtroVagaId = Number(vagaParam) || undefined;

  let candidaturas: Awaited<ReturnType<typeof getCandidaturas>> = [];
  let erro = false;
  try {
    candidaturas = await getCandidaturas(filtroVagaId);
  } catch {
    erro = true;
  }
  if (erro) return <SetupNotice tabelas />;

  const vagaFiltro = filtroVagaId ? await getVagaPorId(filtroVagaId).catch(() => null) : null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">Candidatos</h1>
          <p className="mt-1 text-sm text-gelo-dim">
            {vagaFiltro
              ? <>Candidaturas pra <strong className="text-gelo">{vagaFiltro.nome}</strong>.{" "}
                  <Link href="/admin/equipe/recrutamento/candidatos" className="text-roxo-light underline">ver todas</Link>
                </>
              : "Todas as candidaturas recebidas, de todas as vagas."}
          </p>
        </div>
      </div>

      {candidaturas.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Nenhuma candidatura ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidaturas.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-5">
              <Link
                href={`/admin/equipe/recrutamento/candidatos/${c.id}`}
                className="flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  {c.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.foto}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-ink-line object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink-line bg-ink text-sm font-medium text-gelo-dim">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-gelo">{c.nome}</h3>
                    <p className="flex items-center gap-1 truncate text-xs text-gelo-dim">
                      <Briefcase className="h-3 w-3 shrink-0" /> {c.vagaNome}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_COR[c.status]}`}>
                    {CANDIDATURA_STATUS_LABEL[c.status]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gelo-dim">
                  <span>{c.criadoEmLabel}</span>
                  {c.cidade && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.cidade}</span>
                  )}
                </div>
                {c.experiencia && (
                  <p className="truncate text-xs text-gelo-dim">{c.experiencia}</p>
                )}
              </Link>

              <div className="flex items-center justify-end border-t border-ink-line pt-3">
                <form action={deleteCandidatura}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmitButton
                    confirmMsg={`Excluir a candidatura de ${c.nome}? Essa ação não pode ser desfeita.`}
                    ariaLabel="Excluir candidatura"
                    className="rounded-lg border border-ink-line bg-ink p-1.5 text-red-300/70 hover:border-red-500/30 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
