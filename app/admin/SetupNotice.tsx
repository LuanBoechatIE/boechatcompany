import { DatabaseZap } from "lucide-react";

// Aviso mostrado quando o banco ainda não está configurado (ou as tabelas
// ainda não foram criadas). Guia o Luan pra deixar tudo pronto.
export function SetupNotice({ tabelas = false }: { tabelas?: boolean }) {
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-6 text-sm leading-relaxed text-yellow-100/90">
      <p className="flex items-center gap-2 font-display text-lg uppercase text-gelo">
        <DatabaseZap className="h-5 w-5 text-yellow-300" />
        Falta ligar o banco de dados
      </p>
      {tabelas ? (
        <p className="mt-3">
          O banco está conectado, mas as tabelas ainda não existem. Abra o SQL
          Editor (Neon ou painel da Vercel), cole o conteúdo de{" "}
          <code className="text-roxo-light">app/lib/db/schema.sql</code> e rode
          uma vez.
        </p>
      ) : (
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>
            No painel da Vercel do site, aba <strong>Storage</strong>, crie um
            banco <strong>Postgres (Neon)</strong> e conecte ao projeto. Isso
            injeta a variável <code className="text-roxo-light">DATABASE_URL</code>{" "}
            sozinho.
          </li>
          <li>
            Abra o SQL Editor do banco, cole o conteúdo de{" "}
            <code className="text-roxo-light">app/lib/db/schema.sql</code> e rode.
          </li>
          <li>Redeploy do site. Recarregue esta página.</li>
        </ol>
      )}
    </div>
  );
}
