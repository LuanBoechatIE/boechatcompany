import { ShieldX } from "lucide-react";

// Mostrado quando o usuário não tem permissão para ver a área.
export function SemPermissao({ area = "esta área" }: { area?: string }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
      <ShieldX className="mx-auto h-8 w-8 text-red-300" />
      <p className="mt-3 font-display text-lg uppercase text-gelo">Acesso restrito</p>
      <p className="mt-1 text-sm text-gelo-dim">Você não tem permissão para acessar {area}.</p>
    </div>
  );
}
