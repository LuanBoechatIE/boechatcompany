import { Hammer } from "lucide-react";

// Placeholder das áreas ainda em construção (fases seguintes do CRM).
export function EmBreve({ titulo, fase }: { titulo: string; fase: string }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl uppercase">{titulo}</h1>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line bg-ink-soft/20 p-14 text-center">
        <Hammer className="h-8 w-8 text-gelo-dim" />
        <p className="text-sm text-gelo-dim">
          Em construção · {fase}
        </p>
      </div>
    </div>
  );
}
