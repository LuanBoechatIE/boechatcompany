// Presets de período do painel de Tráfego (inspirado em Meta Ads / Google Ads).
// Isomórfico: usado tanto no client (pickers) quanto no server (validação).
// Datas trafegam como strings YYYY-MM-DD (data local, sem fuso).

export type PresetKey =
  | "hoje"
  | "ontem"
  | "7d"
  | "14d"
  | "30d"
  | "este_mes"
  | "mes_passado"
  | "custom";

export const PERIODO_PRESETS: { key: PresetKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "14d", label: "Últimos 14 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "este_mes", label: "Este mês" },
  { key: "mes_passado", label: "Mês passado" },
  { key: "custom", label: "Período personalizado" },
];

export type Range = { from: string; to: string };

// Formata um Date como YYYY-MM-DD usando os componentes locais.
function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

function addDays(d: Date, n: number): Date {
  const nova = new Date(d);
  nova.setDate(nova.getDate() + n);
  return nova;
}

// Converte um preset em intervalo concreto. `hoje` permite injeção pra teste.
export function rangeFromPreset(preset: PresetKey, hoje = new Date()): Range {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  switch (preset) {
    case "hoje":
      return { from: iso(base), to: iso(base) };
    case "ontem": {
      const o = addDays(base, -1);
      return { from: iso(o), to: iso(o) };
    }
    case "7d":
      return { from: iso(addDays(base, -6)), to: iso(base) };
    case "14d":
      return { from: iso(addDays(base, -13)), to: iso(base) };
    case "30d":
      return { from: iso(addDays(base, -29)), to: iso(base) };
    case "este_mes": {
      const ini = new Date(base.getFullYear(), base.getMonth(), 1);
      return { from: iso(ini), to: iso(base) };
    }
    case "mes_passado": {
      const ini = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      const fim = new Date(base.getFullYear(), base.getMonth(), 0);
      return { from: iso(ini), to: iso(fim) };
    }
    default:
      return { from: iso(addDays(base, -29)), to: iso(base) };
  }
}

const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isRangeValido(from: string, to: string): boolean {
  if (!DATA_RE.test(from) || !DATA_RE.test(to)) return false;
  const a = new Date(from);
  const b = new Date(to);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
  return a.getTime() <= b.getTime();
}

// "2026-07-01" -> "01/07/2026"
export function formatarData(iso: string): string {
  if (!DATA_RE.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatarRangeLabel(from: string, to: string): string {
  return from === to
    ? formatarData(from)
    : `${formatarData(from)} a ${formatarData(to)}`;
}

// Remove acentos, espaços e caixa alta pra compor nomes de arquivo.
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// trafego-ct-power-000123-2026-07-01-a-2026-07-22.png
export function nomeArquivo(
  nomeCliente: string,
  idFormatado: string,
  from: string,
  to: string,
): string {
  const partes = ["trafego", slugify(nomeCliente), slugify(idFormatado), from, "a", to];
  return `${partes.filter(Boolean).join("-")}.png`;
}

// ID exibido com zeros à esquerda (ex.: 123 -> "000123").
export function formatarIdCliente(id: number): string {
  return String(id).padStart(6, "0");
}
