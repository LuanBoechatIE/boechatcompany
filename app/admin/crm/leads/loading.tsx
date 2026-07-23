// Skeleton de carregamento da Central comercial.
export default function LeadsLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 rounded-lg bg-ink-soft" />
          <div className="h-4 w-72 rounded bg-ink-soft/60" />
        </div>
        <div className="h-10 w-40 rounded-full bg-ink-soft" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl border border-ink-line bg-ink-soft/40" />
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="h-10 w-full rounded-xl bg-ink-soft/50" />

      {/* Colunas do pipeline */}
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-2">
            <div className="h-4 w-32 rounded bg-ink-soft/60" />
            <div className="flex flex-col gap-2 rounded-2xl border border-ink-line bg-ink-soft/25 p-2">
              {Array.from({ length: 3 }).map((__, j) => (
                <div key={j} className="h-28 rounded-xl border border-ink-line bg-ink" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
