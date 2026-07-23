"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { formatPct } from "@/app/lib/crm/format";
import type { VendedorRanking } from "@/app/lib/crm/equipe-data";

type Coluna =
  | "nome" | "ligacoes" | "atendidas" | "decisores" | "reunioes" | "whatsapps"
  | "followups" | "taxaAtendimento" | "taxaConversao" | "tempoReuniao" | "tentativas";

const num1 = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

function valorDe(v: VendedorRanking, c: Coluna): number | string {
  const m = v.metrics;
  const taxaConversao = m.leadsGanhos + m.leadsPerdidos > 0 ? (m.leadsGanhos / (m.leadsGanhos + m.leadsPerdidos)) * 100 : 0;
  switch (c) {
    case "nome": return v.nome;
    case "ligacoes": return m.atividade.total.ligacoes;
    case "atendidas": return m.atividade.total.atendidas;
    case "decisores": return m.atividade.total.decisores;
    case "reunioes": return m.atividade.total.reunioes;
    case "whatsapps": return m.atividade.total.whatsapps;
    case "followups": return m.atividade.total.followupsCriados;
    case "taxaAtendimento": return m.atividade.taxaAtendimento;
    case "taxaConversao": return taxaConversao;
    case "tempoReuniao": return m.atividade.mediaDiasReuniao;
    case "tentativas": return m.atividade.mediaTentativasReuniao;
  }
}

export function RankingTable({
  vendedores,
  onAbrir,
}: {
  vendedores: VendedorRanking[];
  onAbrir: (usuarioId: number) => void;
}) {
  const [sort, setSort] = useState<Coluna>("reunioes");
  const [asc, setAsc] = useState(false);

  const linhas = [...vendedores].sort((a, b) => {
    const va = valorDe(a, sort);
    const vb = valorDe(b, sort);
    const d = typeof va === "string" ? va.localeCompare(String(vb)) : va - (vb as number);
    return asc ? d : -d;
  });

  function toggle(c: Coluna) {
    if (sort === c) setAsc((v) => !v);
    else { setSort(c); setAsc(false); }
  }

  const Th = ({ c, label, right = false }: { c: Coluna; label: string; right?: boolean }) => (
    <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <button onClick={() => toggle(c)} className={`inline-flex items-center gap-1 hover:text-gelo ${sort === c ? "text-gelo" : ""}`}>
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </th>
  );

  if (vendedores.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-line bg-ink-soft/25 py-16 text-center text-sm text-gelo-dim/50">
        Nenhum vendedor ativo ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-line bg-ink-soft/25">
      <table className="w-full min-w-[64rem] text-sm">
        <thead className="border-b border-ink-line text-[11px] uppercase tracking-wide text-gelo-dim">
          <tr>
            <Th c="nome" label="Vendedor" />
            <Th c="ligacoes" label="Ligações" right />
            <Th c="atendidas" label="Atendidas" right />
            <Th c="decisores" label="Decisores" right />
            <Th c="reunioes" label="Reuniões" right />
            <Th c="whatsapps" label="WhatsApps" right />
            <Th c="followups" label="Follow-ups" right />
            <Th c="taxaAtendimento" label="Tx. atendimento" right />
            <Th c="taxaConversao" label="Tx. conversão" right />
            <Th c="tempoReuniao" label="Dias até reunião" right />
            <Th c="tentativas" label="Tentativas/reunião" right />
          </tr>
        </thead>
        <tbody>
          {linhas.map((v) => (
            <tr
              key={v.usuarioId}
              onClick={() => onAbrir(v.usuarioId)}
              className="cursor-pointer border-b border-ink-line/50 last:border-0 hover:bg-ink-soft/50"
            >
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {v.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.foto} alt={v.nome} className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-roxo/20 text-[10px] text-roxo-light">
                      {v.nome.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium text-gelo">{v.nome}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.ligacoes}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.atendidas}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.decisores}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.reunioes}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.whatsapps}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{v.metrics.atividade.total.followupsCriados}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{formatPct(v.metrics.atividade.taxaAtendimento)}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{formatPct(Number(valorDe(v, "taxaConversao")))}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{num1(v.metrics.atividade.mediaDiasReuniao)}</td>
              <td className="px-3 py-2.5 text-right text-gelo-dim">{num1(v.metrics.atividade.mediaTentativasReuniao)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
