"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Copy, Check } from "lucide-react";
import { contratarCandidatura, type ContratarResult } from "../../../../recrutamento-actions";

export function ContratarBotao({
  candidaturaId,
  cargoIdSugerido,
  cargos,
}: {
  candidaturaId: number;
  cargoIdSugerido: number | null;
  cargos: { id: number; nome: string }[];
}) {
  const router = useRouter();
  const [abrindo, setAbrindo] = useState(false);
  const [cargoId, setCargoId] = useState<number | "">(cargoIdSugerido ?? "");
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ContratarResult | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (resultado?.ok) {
    return (
      <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <p className="font-medium text-emerald-300">
          Contratado(a)! Usuário <strong>{resultado.username}</strong> criado.
        </p>
        {resultado.emailEnviado ? (
          <p className="mt-1 text-sm text-gelo-dim">E-mail de boas-vindas enviado pra {resultado.username}.</p>
        ) : (
          <div className="mt-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-3">
            <p className="text-sm text-yellow-100/90">
              Não deu pra mandar o e-mail ({resultado.emailMotivo}). Passa a senha temporária manualmente:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded bg-ink px-2 py-1 text-sm text-roxo-light">{resultado.senhaTemporaria}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(resultado.senhaTemporaria);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="flex items-center gap-1 rounded-lg border border-ink-line bg-ink px-2 py-1 text-xs text-gelo-dim hover:text-gelo"
              >
                {copiado ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiado ? "Copiada" : "Copiar"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gelo-dim">Ela só funciona uma vez: no primeiro acesso, a troca é obrigatória.</p>
          </div>
        )}
      </div>
    );
  }

  if (!abrindo) {
    return (
      <button
        onClick={() => setAbrindo(true)}
        className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white"
      >
        <UserPlus className="h-4 w-4" />
        Contratar
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ink-line bg-ink-soft/30 p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-gelo-dim">Cargo (pode ajustar antes de confirmar)</span>
        <select
          value={cargoId}
          onChange={(e) => setCargoId(e.target.value ? Number(e.target.value) : "")}
          className="rounded-xl border border-ink-line bg-ink p-2.5 text-sm outline-none focus:border-roxo-light/60"
        >
          <option value="">Sem cargo</option>
          {cargos.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </label>
      {resultado && !resultado.ok && (
        <p className="text-sm text-red-300">{resultado.erro}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const fd = new FormData();
              fd.set("candidaturaId", String(candidaturaId));
              if (cargoId) fd.set("cargoId", String(cargoId));
              const r = await contratarCandidatura(fd);
              setResultado(r);
              if (r.ok) router.refresh();
            })
          }
          className="rounded-full bg-roxo px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {pending ? "Contratando..." : "Confirmar contratação"}
        </button>
        <button onClick={() => setAbrindo(false)} className="text-sm text-gelo-dim hover:text-gelo">
          Cancelar
        </button>
      </div>
    </div>
  );
}
