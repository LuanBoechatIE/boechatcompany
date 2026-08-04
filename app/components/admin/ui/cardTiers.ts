// Três pesos de card (polish v1). A diferença entre eles é tamanho, respiro e
// elevação — NUNCA matiz. Importância se mede em espaço, não em cor.
//
//   Hero     — teto de 1 por tela. surface-3, respiro maior, número grande.
//   Standard — o card padrão, o que mais aparece. surface-2.
//   Compact  — listas, contadores de apoio. transparente, preenche no hover.
//
// Usar via CARD_TIER[tier].container / .value. Os tokens bg-surface-* e
// border-line-* vêm de globals.css.

export type CardTier = "hero" | "standard" | "compact";

export const CARD_TIER: Record<CardTier, { container: string; value: string }> = {
  hero: {
    container:
      "rounded-[20px] border border-line-strong bg-surface-3 p-7 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset] transition-colors hover:border-roxo-light/40",
    value: "text-[3.4rem]",
  },
  standard: {
    container:
      "rounded-2xl border border-line bg-surface-2 p-5 transition-colors hover:border-roxo-light/30",
    value: "text-[1.85rem]",
  },
  compact: {
    container:
      "rounded-xl border border-line bg-transparent p-3.5 transition-colors hover:border-roxo-light/20 hover:bg-surface-2",
    value: "text-[1.15rem]",
  },
};
