"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { EQUIPE_PERIODO_LABEL, type EquipePeriodo } from "@/app/lib/crm/equipe-data";

const OPCOES: EquipePeriodo[] = ["hoje", "7dias", "30dias", "mes", "tudo"];

export function PeriodoFiltro({ atual }: { atual: EquipePeriodo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function selecionar(periodo: EquipePeriodo) {
    const params = new URLSearchParams(searchParams.toString());
    if (periodo === "tudo") params.delete("periodo");
    else params.set("periodo", periodo);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5 rounded-full border border-ink-line bg-ink-soft/30 p-1">
      {OPCOES.map((p) => (
        <button
          key={p}
          onClick={() => selecionar(p)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            atual === p ? "bg-roxo text-white" : "text-gelo-dim hover:text-gelo"
          }`}
        >
          {EQUIPE_PERIODO_LABEL[p]}
        </button>
      ))}
    </div>
  );
}
