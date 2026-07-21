import { eq } from "drizzle-orm";
import { dbConfigured, getDb } from "@/app/lib/db";
import { clientes, presets, respostas } from "@/app/lib/db/schema";
import type { FieldDef, RespostaValores } from "@/app/lib/onboarding/types";
import { OnboardingForm } from "./OnboardingForm";

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

export default async function OnboardingCliente({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!dbConfigured()) {
    return (
      <Casca>
        <Aviso
          titulo="Indisponível"
          texto="Este formulário está temporariamente indisponível. Fale com quem te enviou o link."
        />
      </Casca>
    );
  }

  let cliente: typeof clientes.$inferSelect | undefined;
  let campos: FieldDef[] = [];
  let valores: RespostaValores = {};

  try {
    const db = getDb();
    const cRows = await db
      .select()
      .from(clientes)
      .where(eq(clientes.token, token))
      .limit(1);
    cliente = cRows[0];
    if (cliente) {
      const [pRows, rRows] = await Promise.all([
        db.select().from(presets).where(eq(presets.id, cliente.presetId)).limit(1),
        db.select().from(respostas).where(eq(respostas.clienteId, cliente.id)).limit(1),
      ]);
      campos = (pRows[0]?.campos as FieldDef[]) ?? [];
      valores = (rRows[0]?.valores as RespostaValores) ?? {};
    }
  } catch {
    return (
      <Casca>
        <Aviso
          titulo="Indisponível"
          texto="Não deu pra carregar o formulário agora. Tenta de novo em instantes."
        />
      </Casca>
    );
  }

  if (!cliente) {
    return (
      <Casca>
        <Aviso
          titulo="Link inválido"
          texto="Esse link não é válido. Confere com quem te enviou."
        />
      </Casca>
    );
  }

  if (cliente.status === "respondido") {
    return (
      <Casca>
        <Aviso
          titulo="Já recebemos"
          texto="Suas respostas já foram enviadas. Se precisar corrigir alguma coisa, é só falar com a gente que reabrimos pra você."
        />
      </Casca>
    );
  }

  return (
    <Casca>
      <div className="mb-8">
        <h1 className="font-display text-3xl uppercase text-gelo">
          Vamos começar, {cliente.nome}
        </h1>
        <p className="mt-2 text-sm text-gelo-dim">
          Responde as perguntas abaixo pra gente já sair construindo. Leva
          poucos minutos. Os campos com <span className="text-roxo-light">*</span>{" "}
          são obrigatórios.
        </p>
      </div>
      <OnboardingForm token={token} campos={campos} valores={valores} />
    </Casca>
  );
}
