function Pulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-ink-soft/40 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Pulse className="h-8 w-56" />
          <Pulse className="mt-2 h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-9 w-28" />
          <Pulse className="h-9 w-32" />
          <Pulse className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Pulse key={i} className="h-24" />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Pulse className="h-56 lg:col-span-1" />
        <Pulse className="h-56 lg:col-span-1" />
        <Pulse className="h-56 lg:col-span-1" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-20" />
            ))}
          </div>
          <Pulse className="h-40" />
        </div>
        <Pulse className="h-64" />
      </div>
    </div>
  );
}
