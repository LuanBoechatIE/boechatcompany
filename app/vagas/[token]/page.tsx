import { MapPin, Briefcase } from "lucide-react";
import { eq } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { presets } from "@/app/lib/db/schema";
import { getVagaPorToken } from "@/app/lib/recrutamento/data";
import type { FieldDef } from "@/app/lib/onboarding/types";
import { MODELO_LABEL, type VagaModelo } from "@/app/lib/recrutamento/types";
import { VagaApplyForm } from "./VagaApplyForm";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

function Casca({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl px-6 py-14">
      <div className="mb-10 font-display text-xl uppercase">
        Boechat<span className="text-roxo">.</span>
      </div>
      {children}
    </div>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-3xl border border-ink-line bg-ink-soft/30 p-8">
      <div className="font-display text-2xl uppercase text-gelo">{titulo}</div>
      <p className="mt-3 text-sm text-gelo-dim">{texto}</p>
    </div>
  );
}

export default async function VagaPublica({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!dbConfigured()) {
    return (
      <Casca>
        <Aviso titulo="Indisponível" texto="Esta página está temporariamente indisponível." />
      </Casca>
    );
  }

  let vaga: Awaited<ReturnType<typeof getVagaPorToken>> = null;
  let campos: FieldDef[] = [];
  try {
    vaga = await getVagaPorToken(token);
    if (vaga?.presetId) {
      const rows = await getDb().select().from(presets).where(eq(presets.id, vaga.presetId)).limit(1);
      campos = (rows[0]?.campos as FieldDef[]) ?? [];
    }
  } catch {
    return (
      <Casca>
        <Aviso titulo="Indisponível" texto="Não deu pra carregar a vaga agora. Tenta de novo em instantes." />
      </Casca>
    );
  }

  if (!vaga) {
    return (
      <Casca>
        <Aviso titulo="Vaga não encontrada" texto="Esse link não é válido. Confere se copiou certo." />
      </Casca>
    );
  }

  if (vaga.status === "rascunho") {
    return (
      <Casca>
        <Aviso titulo="Vaga ainda não publicada" texto="Esta vaga ainda está sendo preparada. Volte em breve." />
      </Casca>
    );
  }

  if (vaga.status === "fechada") {
    return (
      <Casca>
        <Aviso titulo="Vaga encerrada" texto="Esta vaga não está mais recebendo candidaturas. Fique de olho nas próximas." />
      </Casca>
    );
  }

  return (
    <Casca>
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase text-gelo">{vaga.nome}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gelo-dim">
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" /> {MODELO_LABEL[vaga.modelo as VagaModelo]}
          </span>
          {vaga.cidade && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {vaga.cidade}
            </span>
          )}
        </div>
        {vaga.descricao && (
          <p className="mt-4 whitespace-pre-line text-sm text-gelo-dim">{vaga.descricao}</p>
        )}
        <p className="mt-6 text-sm text-gelo-dim">
          Preencha os campos abaixo pra se candidatar. Os campos com{" "}
          <span className="text-roxo-light">*</span> são obrigatórios.
        </p>
      </div>
      <VagaApplyForm token={token} campos={campos} />
    </Casca>
  );
}
