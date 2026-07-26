// Camada única de acesso ao Claude no módulo de Conteúdo.
// Ninguém mais no módulo importa o SDK direto — assim modelo, caching, custo e
// tratamento de recusa ficam num lugar só.
//
// ⚠️ Contexto em camadas (a alternativa a RAG, ver decisoes.md 2026-07-26):
//   L0 marca      ~1,5k tokens  estável   → cacheado
//   L1 brief      ~8k tokens    estável   → cacheado
//   L2 ledger     ~2k tokens    volátil   → depois do último breakpoint
//   L3 instrução  pequena       volátil   → mensagem do usuário
// O breakpoint de cache vai no ÚLTIMO bloco estável. Qualquer byte que mude
// antes dele invalida tudo depois, então a ordem acima não é decorativa.
import Anthropic from "@anthropic-ai/sdk";

// Trocáveis por env sem mexer em código. O padrão é o modelo mais capaz: a
// qualidade da copy é o produto aqui, e o prompt caching já derruba o custo
// por post pra centavos.
export const MODELO_GERACAO =
  process.env.CONTEUDO_MODELO_GERACAO ?? "claude-opus-5";
/** Jobs baratos e mecânicos: descrever asset, comprimir ledger. */
export const MODELO_AUXILIAR =
  process.env.CONTEUDO_MODELO_AUXILIAR ?? "claude-haiku-4-5";

let _client: Anthropic | null = null;

export function iaConfigurada(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "IA não configurada: defina ANTHROPIC_API_KEY na Vercel (ver .env.example).",
    );
  }
  _client = new Anthropic();
  return _client;
}

/** Um bloco do system prompt. `estavel` decide se entra no prefixo cacheado. */
export type Camada = { texto: string; estavel: boolean };

export type Uso = {
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
  tokensCacheLidos: number;
  tokensCacheEscritos: number;
};

export class RecusaDaIa extends Error {
  constructor(readonly categoria: string | null) {
    super(
      `A IA recusou a solicitação${categoria ? ` (categoria: ${categoria})` : ""}.`,
    );
    this.name = "RecusaDaIa";
  }
}

function montarSystem(
  camadas: Camada[],
): Anthropic.Beta.BetaTextBlockParam[] {
  const blocos = camadas
    .filter((c) => c.texto.trim().length > 0)
    // Estáveis primeiro: é o que torna o prefixo cacheável.
    .sort((a, b) => Number(b.estavel) - Number(a.estavel))
    .map<Anthropic.Beta.BetaTextBlockParam>((c) => ({
      type: "text",
      text: c.texto,
    }));

  // Breakpoint no último bloco estável. Sem nenhum bloco estável, não marca
  // nada: cachear um prefixo que muda toda hora só paga o prêmio de escrita.
  let ultimoEstavel = -1;
  camadas
    .filter((c) => c.texto.trim().length > 0)
    .sort((a, b) => Number(b.estavel) - Number(a.estavel))
    .forEach((c, i) => {
      if (c.estavel) ultimoEstavel = i;
    });
  if (ultimoEstavel >= 0) {
    blocos[ultimoEstavel] = {
      ...blocos[ultimoEstavel],
      cache_control: { type: "ephemeral" },
    };
  }
  return blocos;
}

function extrairUso(msg: Anthropic.Beta.BetaMessage): Uso {
  return {
    modelo: msg.model,
    tokensEntrada: msg.usage.input_tokens ?? 0,
    tokensSaida: msg.usage.output_tokens ?? 0,
    tokensCacheLidos: msg.usage.cache_read_input_tokens ?? 0,
    tokensCacheEscritos: msg.usage.cache_creation_input_tokens ?? 0,
  };
}

function textoDaResposta(msg: Anthropic.Beta.BetaMessage): string {
  return msg.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

type OpcoesBase = {
  camadas: Camada[];
  instrucao: string;
  modelo?: string;
  maxTokens?: number;
  /** Padrão `high`. `low`/`medium` cortam custo em tarefas mecânicas. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
};

async function chamar(
  opts: OpcoesBase & { formato?: Anthropic.Beta.BetaJSONOutputFormat },
): Promise<Anthropic.Beta.BetaMessage> {
  const msg = await getClient().beta.messages.create({
    model: opts.modelo ?? MODELO_GERACAO,
    max_tokens: opts.maxTokens ?? 16000,
    // Fallback server-side: se os classificadores recusarem, a própria API
    // reexecuta num modelo alternativo em vez de devolver a recusa.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: montarSystem(opts.camadas),
    output_config: {
      effort: opts.effort ?? "high",
      ...(opts.formato ? { format: opts.formato } : {}),
    },
    messages: [{ role: "user", content: opts.instrucao }],
  });

  // Sempre antes de ler content: numa recusa o array vem vazio ou parcial.
  if (msg.stop_reason === "refusal") {
    throw new RecusaDaIa(msg.stop_details?.category ?? null);
  }
  return msg;
}

/** Geração livre (markdown). Usado pelo compilador de brief. */
export async function gerarTexto(
  opts: OpcoesBase,
): Promise<{ texto: string; uso: Uso }> {
  const msg = await chamar(opts);
  return { texto: textoDaResposta(msg), uso: extrairUso(msg) };
}

/**
 * Geração com formato garantido pelo servidor (structured outputs).
 * `schema` é JSON Schema puro; `validar` é a checagem final no nosso lado —
 * as duas coisas, porque schema garante forma, não semântica.
 */
export async function gerarJson<T>(
  opts: OpcoesBase & {
    schema: Record<string, unknown>;
    validar: (bruto: unknown) => T;
  },
): Promise<{ dados: T; uso: Uso }> {
  const msg = await chamar({
    ...opts,
    formato: { type: "json_schema", schema: opts.schema },
  });

  const texto = textoDaResposta(msg);
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new Error(
      `A IA devolveu algo que não é JSON válido (${texto.slice(0, 200)}…).`,
    );
  }
  return { dados: opts.validar(bruto), uso: extrairUso(msg) };
}

/** Estimativa grosseira só pra exibir tamanho de brief na UI. */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 3.6);
}
