"use client";

import { useEffect, useState } from "react";
import { Plus, Upload, Download, ChevronDown } from "lucide-react";
import { brl, type LeadDTO } from "@/app/lib/crm/types";
import { NovoLead } from "./NovoLead";
import { ImportWizard } from "./ImportWizard";

const COLS = [
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
] as const;

function linhaValores(l: LeadDTO): (string | number)[] {
  return [
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
  ];
}

function baixar(blob: Blob, ext: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-boechat-${new Date().toISOString().slice(0, 10)}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function LeadsToolbar({ leads }: { leads: LeadDTO[] }) {
  const [novoOpen, setNovoOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);

  // Atalho de teclado "n" (disparado pelo workspace) abre o formulário.
  useEffect(() => {
    const abrir = () => setNovoOpen(true);
    window.addEventListener("lead:novo", abrir);
    return () => window.removeEventListener("lead:novo", abrir);
  }, []);

  function exportCsv() {
    const header = COLS.join(";");
    const linhas = leads.map((l) =>
      linhaValores(l)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(";"),
    );
    const csv = "﻿" + [header, ...linhas].join("\n");
    baixar(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "csv");
    setExportMenu(false);
  }

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const dados = [COLS as unknown as string[], ...leads.map(linhaValores)];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    baixar(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "xlsx",
    );
    setExportMenu(false);
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

      <button
        onClick={() => setImportOpen(true)}
        className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-4 py-2.5 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo"
      >
        <Upload className="h-4 w-4" />
        Importar contatos
      </button>

      <div className="relative">
        <button
          onClick={() => setExportMenu((v) => !v)}
          disabled={leads.length === 0}
          className="flex items-center gap-2 rounded-full border border-ink-line bg-ink px-4 py-2.5 text-sm text-gelo-dim hover:border-roxo-light/50 hover:text-gelo disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Exportar
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        {exportMenu && (
          <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-ink-line bg-ink-soft shadow-2xl">
            <button onClick={exportCsv} className="block w-full px-4 py-2 text-left text-sm text-gelo-dim hover:bg-ink hover:text-gelo">
              Exportar CSV
            </button>
            <button onClick={exportXlsx} className="block w-full px-4 py-2 text-left text-sm text-gelo-dim hover:bg-ink hover:text-gelo">
              Exportar XLSX
            </button>
          </div>
        )}
      </div>

      {novoOpen && <NovoLead onClose={() => setNovoOpen(false)} />}
      {importOpen && <ImportWizard onClose={() => setImportOpen(false)} />}
    </div>
  );
}
