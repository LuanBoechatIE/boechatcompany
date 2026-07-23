"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Podio } from "./Podio";
import { RankingTable } from "./RankingTable";
import { ComparativoCharts } from "./ComparativoCharts";
import { VendedorPainel } from "./VendedorPainel";
import type { VendedorRanking } from "@/app/lib/crm/equipe-data";

export function EquipeWorkspace({ vendedores }: { vendedores: VendedorRanking[] }) {
  const [abertoId, setAbertoId] = useState<number | null>(null);
  const aberto = vendedores.find((v) => v.usuarioId === abertoId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <Podio vendedores={vendedores} onAbrir={setAbertoId} />
      <RankingTable vendedores={vendedores} onAbrir={setAbertoId} />
      <ComparativoCharts vendedores={vendedores} />

      <AnimatePresence>
        {aberto && <VendedorPainel key={aberto.usuarioId} vendedor={aberto} onClose={() => setAbertoId(null)} />}
      </AnimatePresence>
    </div>
  );
}
