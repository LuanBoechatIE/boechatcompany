// Mapa produto → arquivos do vault que alimentam o brief dele.
//
// É semente, não lei: os globs ficam editáveis no banco (`cont_produtos`).
// Serve pra plataforma nascer útil em vez de vazia esperando configuração.
//
// ⚠️ `marca` é a camada L0, carregada em TODA geração. Não é um "produto" que
// aparece como opção de assunto — é o guarda-chuva (pilares, tom, promessa-mãe,
// proibições). Ver decisão de 2026-07-26 em decisoes.md.

export type ProdutoPadrao = {
  slug: string;
  nome: string;
  descricao: string;
  ehMarca: boolean;
  ordem: number;
  vaultGlobs: string[];
};

const V = "maquina-de-caixa";

export const PRODUTOS_PADRAO: ProdutoPadrao[] = [
  {
    slug: "marca",
    nome: "Marca Boechat",
    descricao:
      "Camada base: pilares de conteúdo, tom, promessa-mãe e proibições duras. Entra em toda geração.",
    ehMarca: true,
    ordem: 0,
    vaultGlobs: [
      `${V}/06-presenca/marca.md`,
      `${V}/06-presenca/instagram.md`,
      `${V}/06-presenca/meu-site.md`,
      `${V}/00-estrategia/decisoes.md`,
      `${V}/.agents/*.md`,
    ],
  },
  {
    slug: "dark-kitchen",
    nome: "Dark Kitchen",
    descricao:
      "Braço de delivery: webinar, playbook e roteiro de reunião do produto de dark kitchen.",
    ehMarca: false,
    ordem: 1,
    vaultGlobs: [`${V}/01-oferta/dark-kitchen*.md`],
  },
  {
    slug: "concessionarias",
    nome: "Catálogo Concessionária",
    descricao:
      "Braço de concessionárias: oferta, catálogo, prospecção, objeções e decks de reunião.",
    ehMarca: false,
    ordem: 2,
    vaultGlobs: [
      `${V}/01-oferta/concessionarias*.md`,
      `${V}/01-oferta/termo-servico-concessionarias.md`,
      `${V}/02-comercial/concessionarias/**`,
      // ⚠️ Faltavam os 4 abaixo (corrigido 2026-07-27). Sem eles o brief nascia
      // cego justamente pra pesquisa de mercado, pro ICP e pro custo real, que
      // é onde estão os dados que contradizem o pitch antigo.
      `${V}/05-prospeccao/icp-concessionarias.md`,
      `${V}/05-prospeccao/analise-mercado-concessionarias.md`,
      `${V}/04-entrega/intake-concessionarias.md`,
      `${V}/07-operacao/custo-infra-concessionarias.md`,
    ],
  },
  {
    slug: "site",
    nome: "Site / Landing Page",
    descricao:
      "Oferta de entrada: site que converte, escopo, manutenção e método de entrega.",
    ehMarca: false,
    ordem: 3,
    vaultGlobs: [`${V}/01-oferta/front-end.md`, `${V}/04-entrega/*.md`],
  },
  {
    slug: "back-end",
    nome: "Sistemas (back-end)",
    descricao:
      "Ascensão da escada de valor: Agenda Cheia, Resposta Imediata e Funil de Retorno.",
    ehMarca: false,
    ordem: 4,
    vaultGlobs: [`${V}/01-oferta/back-end.md`],
  },
  {
    slug: "mentoria",
    nome: "Mentoria",
    descricao: "Oferta de mentoria comercial.",
    ehMarca: false,
    ordem: 5,
    vaultGlobs: [`${V}/01-oferta/mentoria.md`],
  },
];
