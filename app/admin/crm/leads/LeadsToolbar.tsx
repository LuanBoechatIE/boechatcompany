"use client";

import { useState } from "react";
import { Plus, Upload, Download } from "lucide-react";
import { brl, type LeadDTO } from "@/app/lib/crm/types";
import { NovoLead } from "./NovoLead";

function toCsv(leads: LeadDTO[]): string {
  const cols = [
    "nome",
    "empresa",
    "pessoaContato",
    "telefone",
    "whatsapp",
    "email",
    "servico",
    "origem",
    "responsavel",
    "valorEstimado",
    "status",
    "tags",
    "criadoEm",
  ];
  const header = cols.join(";");
  const linhas = leads.map((l) =>
    [
      l.nome,
      l.empresa,
      l.pessoaContato,
      l.telefone,
      l.whatsapp,
      l.email,
      l.servico,
      l.origem,
      l.responsavel,
      l.valorEstimado ? brl(Number(l.valorEstimado)) : "",
      l.status,
      l.tags,
      l.criadoEmLabel,
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(";"),
  );
  return [header, ...linhas].join("\n");
}

export function LeadsToolbar({ leads }: { leads: LeadDTO[] }) {
  const [novoOpen, setNovoOpen] = useState(false);
  const [importNota, setImportNota] = useState(false);

  function exportar() {
    const csv = "﻿" + toCsv(leads); // BOM pra Excel abrir acentos certo
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-boechat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setNovoOpen(true)}
        className="flex items-center gap-2 rounded-full bg-roxo px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_-8px_rgba(109,40,217,0.7)] hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Novo lead
      </button>

      <div className="relative">
        <button
          onClick={() => setImportNota((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-4 py-2.5 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
        >
          <Upload className="h-4 w-4" />
          Importar contatos
        </button>
        {importNota && (
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-ink-line bg-ink-soft p-3 text-xs text-gelo-dim shadow-2xl">
            A importação de CSV/XLSX (com mapeamento e detecção de duplicados)
            entra na próxima fase. Por enquanto, cadastre em “Novo lead”.
          </div>
        )}
      </div>

      <button
        onClick={exportar}
        disabled={leads.length === 0}
        className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-4 py-2.5 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo disabled:opacity-40"
      >
        <Download className="h-4 w-4" />
        Exportar
      </button>

      {novoOpen && <NovoLead onClose={() => setNovoOpen(false)} />}
    </div>
  );
}
