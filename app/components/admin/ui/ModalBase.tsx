"use client";

import { X } from "lucide-react";

// Extraído de app/admin/configuracoes/AdminContas.tsx pra ser reaproveitado
// pelo fluxo de prévia de acesso (PreviewAcessoModal) sem duplicar o chrome
// de modal. Existe uma segunda cópia local em app/admin/crm/demandas/
// AprovacoesPanel.tsx (módulo de CRM) — fora do escopo desta tarefa, não
// mexida.
// size é opcional (default "lg", igual ao comportamento original em
// AdminContas.tsx) — PreviewAcessoModal usa "2xl" pra caber o preview do
// e-mail ao lado dos campos editáveis.
export function ModalBase({
  titulo,
  onClose,
  children,
  size = "lg",
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "lg" | "2xl";
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
      <div className={`my-8 w-full ${size === "2xl" ? "max-w-2xl" : "max-w-lg"} rounded-2xl border border-ink-line bg-ink-soft shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-ink-line px-5 py-4">
          <h3 className="font-display text-lg uppercase text-gelo">{titulo}</h3>
          <button onClick={onClose} className="text-gelo-dim hover:text-gelo"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
