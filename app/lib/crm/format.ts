export function formatBRL(v: number, opts?: { compact?: boolean }) {
  if (opts?.compact && Math.abs(v) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatPct(v: number) {
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function formatDateFull(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
