export type PeriodoKey = "hoje" | "semana" | "mes" | "ano" | "custom";

export type Periodo = {
  key: PeriodoKey;
  start: Date;
  end: Date; // exclusivo
  label: string;
  de: string; // yyyy-mm-dd, pra preencher o input de data
  ate: string;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmt(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function resolvePeriodo(sp: {
  periodo?: string;
  de?: string;
  ate?: string;
}): Periodo {
  const hoje = startOfDay(new Date());
  const key = (sp.periodo as PeriodoKey) ?? "mes";

  if (key === "hoje") {
    const end = addDays(hoje, 1);
    return { key, start: hoje, end, label: "Hoje", de: iso(hoje), ate: iso(hoje) };
  }

  if (key === "semana") {
    const dow = (hoje.getDay() + 6) % 7; // segunda = 0
    const start = addDays(hoje, -dow);
    const end = addDays(start, 7);
    return {
      key,
      start,
      end,
      label: "Essa semana",
      de: iso(start),
      ate: iso(addDays(end, -1)),
    };
  }

  if (key === "ano") {
    const start = new Date(hoje.getFullYear(), 0, 1);
    const end = new Date(hoje.getFullYear() + 1, 0, 1);
    return { key, start, end, label: `${hoje.getFullYear()}`, de: iso(start), ate: iso(addDays(end, -1)) };
  }

  if (key === "custom" && sp.de && sp.ate) {
    const start = startOfDay(new Date(`${sp.de}T00:00:00`));
    const endInclusive = startOfDay(new Date(`${sp.ate}T00:00:00`));
    if (!isNaN(start.getTime()) && !isNaN(endInclusive.getTime()) && start <= endInclusive) {
      const end = addDays(endInclusive, 1);
      return {
        key,
        start,
        end,
        label: `${fmt(start)} – ${fmt(endInclusive)}`,
        de: sp.de,
        ate: sp.ate,
      };
    }
  }

  // default: mês corrente
  const start = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const end = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  return { key: "mes", start, end, label: "Este mês", de: iso(start), ate: iso(addDays(end, -1)) };
}
