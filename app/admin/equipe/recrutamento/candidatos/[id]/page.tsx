import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { getCandidaturaCompleta, getVagaPorId } from "@/app/lib/recrutamento/data";
import { CANDIDATURA_STATUS_LABEL } from "@/app/lib/recrutamento/types";
import { temPermissao } from "@/app/lib/perms-guard";
import { SemPermissao } from "../../../../crm/SemPermissao";
import { ConfirmSubmitButton } from "../../../../ConfirmSubmitButton";
import { deleteCandidatura } from "../../../../recrutamento-actions";
import { listCargos } from "../../../../roles-actions";
import { ContratarBotao } from "./ContratarBotao";

export const dynamic = "force-dynamic";

function fmt(v: string | undefined): string {
  if (!v || !v.trim()) return "—";
  if (v === "sim") return "Sim";
  if (v === "nao") return "Não";
  return v;
}

function ehImagem(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|avif)($|\?)/i.test(url);
}

function nomeDoArquivo(url: string): string {
  try {
    return decodeURIComponent(url.split("/").pop() ?? url);
  } catch {
    return url;
  }
}

export default async function CandidatoDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await temPermissao("recrutamento.visualizar"))) return <SemPermissao area="Candidatos" />;

  const { id } = await params;
  const candidaturaId = Number(id);
  if (!candidaturaId) notFound();

  const dados = await getCandidaturaCompleta(candidaturaId);
  if (!dados) notFound();
  const { candidatura, campos, valores } = dados;

  const [vaga, cargos] = await Promise.all([
    getVagaPorId(candidatura.vagaId),
    listCargos(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/equipe/recrutamento/candidatos"
        className="flex w-fit items-center gap-1.5 text-sm text-gelo-dim hover:text-gelo"
      >
        <ArrowLeft className="h-4 w-4" />
        Candidatos
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase">{candidatura.nome}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gelo-dim">
            <span className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4" /> {candidatura.vagaNome}
            </span>
            {candidatura.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {candidatura.email}
              </span>
            )}
            {candidatura.telefone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {candidatura.telefone}
              </span>
            )}
            {candidatura.cidade && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {candidatura.cidade}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gelo-dim">Candidatou-se em {candidatura.criadoEmLabel}</p>
        </div>
        <span className="rounded-full border border-ink-line bg-ink px-3 py-1 text-xs text-gelo-dim">
          {CANDIDATURA_STATUS_LABEL[candidatura.status]}
        </span>
      </div>

      {/* Respostas */}
      <h2 className="mt-10 mb-4 text-sm font-medium text-gelo">Respostas</h2>
      {campos.length === 0 ? (
        <div className="rounded-2xl border border-ink-line bg-ink-soft/30 p-8 text-center text-sm text-gelo-dim">
          Esta vaga não tem formulário com campos extras. Só os dados de contato acima foram enviados.
        </div>
      ) : (
        <dl className="flex flex-col gap-4">
          {campos.map((campo) => (
            <div
              key={campo.id}
              className="rounded-2xl border border-ink-line bg-ink-soft/30 p-5"
            >
              <dt className="text-xs uppercase tracking-wide text-gelo-dim">
                {campo.label}
              </dt>
              <dd className="mt-2 whitespace-pre-wrap break-words text-gelo">
                {(campo.tipo === "arquivo" || campo.tipo === "link") &&
                valores[campo.id]?.trim() ? (
                  <ul className="flex flex-col gap-2">
                    {valores[campo.id]
                      .split("\n")
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .map((u) => (
                        <li key={u} className="flex items-center gap-3">
                          {ehImagem(u) && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-lg border border-ink-line object-cover"
                            />
                          )}
                          <a
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={campo.tipo === "arquivo" ? nomeDoArquivo(u) : undefined}
                            className="break-all text-sm text-roxo-light underline"
                          >
                            {campo.tipo === "arquivo" ? `Baixar ${nomeDoArquivo(u)}` : "Abrir"}
                          </a>
                        </li>
                      ))}
                  </ul>
                ) : (
                  fmt(valores[campo.id])
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Ações do admin */}
      <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-ink-line pt-6">
        {candidatura.status === "contratado" ? (
          <p className="text-sm text-emerald-300">Já foi contratado(a) e virou usuário da plataforma.</p>
        ) : (
          <ContratarBotao
            candidaturaId={candidatura.id}
            cargoIdSugerido={vaga?.cargoId ?? null}
            cargos={cargos.filter((c) => c.ativo).map((c) => ({ id: c.id, nome: c.nome }))}
          />
        )}
        <form action={deleteCandidatura} className="ml-auto">
          <input type="hidden" name="id" value={candidatura.id} />
          <ConfirmSubmitButton
            confirmMsg={`Excluir a candidatura de ${candidatura.nome}? Essa ação não pode ser desfeita.`}
            className="flex items-center gap-1.5 text-sm text-red-300/70 hover:text-red-300"
          >
            Excluir candidatura
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
