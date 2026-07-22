import { Database } from "lucide-react";

// Mostrado quando as tabelas do CRM ainda não foram criadas no banco.
export function CrmSetupNotice() {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm leading-relaxed text-yellow-100/90">
      <p className="flex items-center gap-2 font-display text-lg uppercase text-gelo">
        <Database className="h-5 w-5 text-yellow-300" />
        Falta criar as tabelas do CRM
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>
          Abra o console do banco (Neon ou SQL Editor da Vercel).
        </li>
        <li>
          Cole o conteúdo de{" "}
          <code className="text-roxo-light">app/lib/db/crm.sql</code> e rode uma
          vez.
        </li>
        <li>Recarregue esta página.</li>
      </ol>
    </div>
  );
}
