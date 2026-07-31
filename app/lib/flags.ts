/**
 * Chaves de liga/desliga de partes do site.
 *
 * Existe pra desativar coisa sem apagar código. Toda flag aqui é temporária por
 * natureza: quando a decisão virar permanente, ou o código sai de vez, ou a
 * flag some e o comportamento vira o padrão.
 *
 * Mexeu aqui, roda `npm run build` antes de subir.
 */
export const FLAGS = {
  /**
   * Shader WebGL de fundo (`@paper-design/shaders-react`) no hero e na seção
   * final de CTA.
   *
   * ⏸️ Desligado em 2026-07-31 pra medir quanto ele pesa no carregamento. Com a
   * flag em `false`, entra no lugar um gradiente CSS estático: mesma leitura
   * visual, zero JavaScript, zero canvas, zero animação por frame.
   *
   * Pra reativar: volta pra `true`. Nada foi removido.
   */
  shaderBackground: false,

  /**
   * Página `/sites` (o portfólio de sites, com galeria, KPIs e Lighthouse).
   *
   * ⏸️ Desligada em 2026-07-31, a pedido do dono, enquanto o foco comercial
   * está em concessionárias. Com a flag em `false` a rota devolve 404, some do
   * sitemap e o link no rodapé não aparece.
   *
   * ⚠️ A página é a única vitrine específica do braço site, e a decisão de marca
   * mantém ela fora da home de propósito. Reativar é voltar isto pra `true`.
   */
  paginaSites: false,
} as const;
