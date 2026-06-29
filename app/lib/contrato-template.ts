// Builder do contrato de criação de site + manutenção.
// Estrutura conforme cláusulas essenciais de contrato de prestação de serviços (BR)
// e os termos já decididos no vault (escopo, 2 revisões, pagamento, manutenção,
// propriedade até quitação, LGPD, rescisão, foro).
//
// ⚠️ AVISO JURÍDICO: este template foi estruturado no padrão de mercado, mas NÃO
// substitui revisão de advogado. Antes de usar pra assinar com cliente, peça a um
// advogado pra revisar uma vez. Veja vault: 01-oferta/termo-servico.md.

// Dados da CONTRATADA (Boechat). 🔲 PREENCHER UMA VEZ com os dados reais.
// CNPJ é informação pública, mas se preferir não versionar, mova pra env var.
export const CONTRATADA = {
  nome: "[RAZÃO SOCIAL OU NOME COMPLETO DA BOECHAT]",
  documento: "[CNPJ OU CPF]",
  endereco: "[ENDEREÇO COMPLETO]",
  representante: "[NOME DO REPRESENTANTE LEGAL]",
};

export type FormaPagamento =
  | "À vista, via PIX, no aceite deste contrato"
  | "50% (cinquenta por cento) no aceite e 50% (cinquenta por cento) na entrega";

export type ManutencaoTipo = "mensal" | "anual";

export type ContratoData = {
  // Contratante (cliente)
  tipoPessoa: "PJ" | "PF";
  contratanteNome: string;
  contratanteDoc: string; // CNPJ ou CPF
  contratanteEndereco: string;
  representanteNome: string; // se PJ
  representanteCpf: string; // se PJ
  contratanteEmail: string;
  // Negócio
  valorSite: string; // ex.: "1.250,00"
  formaPagamento: FormaPagamento;
  manutencaoTipo: ManutencaoTipo;
  manutencaoValor: string; // ex.: "100,00" (mensal) ou "500,00" (anual)
  cidadeForo: string; // ex.: "São Paulo/SP"
  data: string; // ex.: "29 de junho de 2026"
};

export type Clausula = { titulo: string; itens: string[] };

function qualificacaoContratante(d: ContratoData): string {
  if (d.tipoPessoa === "PJ") {
    return `${d.contratanteNome}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${d.contratanteDoc}, com sede em ${d.contratanteEndereco}, neste ato representada por ${d.representanteNome}, inscrito(a) no CPF sob nº ${d.representanteCpf}, doravante denominada CONTRATANTE`;
  }
  return `${d.contratanteNome}, inscrito(a) no CPF sob nº ${d.contratanteDoc}, residente e domiciliado(a) em ${d.contratanteEndereco}, doravante denominado(a) CONTRATANTE`;
}

function qualificacaoContratada(): string {
  return `${CONTRATADA.nome}, inscrita sob nº ${CONTRATADA.documento}, com sede em ${CONTRATADA.endereco}, neste ato representada por ${CONTRATADA.representante}, doravante denominada CONTRATADA`;
}

export function buildContrato(d: ContratoData) {
  const manutencaoTexto =
    d.manutencaoTipo === "mensal"
      ? `R$ ${d.manutencaoValor} (mensais), pagos mensalmente`
      : `R$ ${d.manutencaoValor}, pagos anualmente de forma antecipada, válido por 12 (doze) meses`;

  const clausulas: Clausula[] = [
    {
      titulo: "CLÁUSULA 1ª — DO OBJETO",
      itens: [
        "1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de criação de website para a CONTRATANTE, com identidade visual própria, otimizado para conversão (chamada para ação, canal de contato direto e prova social), incluindo domínio e publicação (deploy).",
        "1.2. Estão incluídos: 1 (uma) rodada de coleta de material, desenvolvimento do site e até 2 (duas) rodadas de revisão dentro do escopo acordado.",
        "1.3. NÃO estão incluídos: reformulações fora do escopo acordado, criação de conteúdo do zero sem insumos da CONTRATANTE, integrações ou sistemas complexos, e manutenção contínua após o período de ajuste, os quais, se desejados, serão objeto de contratação à parte.",
      ],
    },
    {
      titulo: "CLÁUSULA 2ª — DAS OBRIGAÇÕES DA CONTRATADA",
      itens: [
        "2.1. Executar os serviços com zelo e técnica, dentro do escopo e prazo previstos.",
        "2.2. Entregar o site publicado e funcional, no domínio acordado.",
        "2.3. Realizar as revisões previstas na Cláusula 1.2.",
      ],
    },
    {
      titulo: "CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CONTRATANTE",
      itens: [
        "3.1. Fornecer, de uma só vez, todo o material necessário (textos, fotos, logotipo, informações de contato e demais insumos) por meio do formulário de coleta indicado pela CONTRATADA.",
        "3.2. Responder às solicitações de aprovação e revisão em tempo hábil.",
        "3.3. Efetuar os pagamentos nas condições pactuadas.",
        "3.4. O atraso na entrega do material pela CONTRATANTE prorroga, na mesma proporção, o prazo de entrega.",
      ],
    },
    {
      titulo: "CLÁUSULA 4ª — DO PRAZO DE ENTREGA",
      itens: [
        "4.1. O site será entregue em até 5 (cinco) dias úteis, contados do recebimento integral do material da CONTRATANTE.",
      ],
    },
    {
      titulo: "CLÁUSULA 5ª — DO PREÇO E DA FORMA DE PAGAMENTO",
      itens: [
        `5.1. Pela criação do site, a CONTRATANTE pagará à CONTRATADA o valor de R$ ${d.valorSite} (valor único, não recorrente).`,
        `5.2. Forma de pagamento: ${d.formaPagamento}.`,
      ],
    },
    {
      titulo: "CLÁUSULA 6ª — DA MANUTENÇÃO E HOSPEDAGEM",
      itens: [
        "6.1. Após a entrega, a CONTRATANTE terá 7 (sete) dias para solicitar ajustes inclusos.",
        `6.2. A partir de então, a manutenção e hospedagem serão prestadas mediante o valor de ${manutencaoTexto}.`,
        "6.3. A manutenção cobre hospedagem e pequenos ajustes de conteúdo, não incluindo redesenho ou novas funcionalidades.",
      ],
    },
    {
      titulo: "CLÁUSULA 7ª — DA PROPRIEDADE E DIREITOS",
      itens: [
        "7.1. O domínio será registrado em nome da CONTRATANTE.",
        "7.2. O código-fonte e os elementos de design permanecem de titularidade da CONTRATADA até a confirmação do pagamento integral, quando os direitos de uso sobre o site entregue são transferidos à CONTRATANTE.",
      ],
    },
    {
      titulo: "CLÁUSULA 8ª — DA PROTEÇÃO DE DADOS (LGPD)",
      itens: [
        "8.1. As partes se comprometem a tratar os dados pessoais a que tiverem acesso em conformidade com a Lei nº 13.709/2018 (LGPD), utilizando-os exclusivamente para a execução deste contrato.",
      ],
    },
    {
      titulo: "CLÁUSULA 9ª — DA VIGÊNCIA E DA RESCISÃO",
      itens: [
        "9.1. Este contrato vigora a partir da assinatura. A parte de manutenção, quando contratada, renova-se automaticamente conforme a periodicidade escolhida, salvo manifestação em contrário.",
        "9.2. A manutenção pode ser cancelada por qualquer das partes mediante aviso prévio, por escrito, de 30 (trinta) dias.",
        "9.3. Em caso de cancelamento após o início dos trabalhos de criação, não haverá devolução dos valores já pagos referentes ao trabalho executado.",
      ],
    },
    {
      titulo: "CLÁUSULA 10ª — DA MULTA",
      itens: [
        "10.1. O descumprimento de qualquer obrigação contratual sujeita a parte infratora ao pagamento de multa de 10% (dez por cento) sobre o valor total deste contrato, sem prejuízo das perdas e danos.",
      ],
    },
    {
      titulo: "CLÁUSULA 11ª — DO FORO",
      itens: [
        `11.1. Fica eleito o foro da comarca de ${d.cidadeForo} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`,
      ],
    },
  ];

  return {
    titulo: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CRIAÇÃO DE SITE E MANUTENÇÃO",
    preambulo: `Pelo presente instrumento particular, de um lado ${qualificacaoContratada()}; e de outro lado ${qualificacaoContratante(d)}; têm entre si, justo e contratado, o seguinte:`,
    clausulas,
    fecho: `E, por estarem assim justas e contratadas, as partes firmam o presente instrumento.`,
    local: `${d.cidadeForo}, ${d.data}.`,
    assinaturas: [CONTRATADA.nome, d.contratanteNome],
    contatoEmail: d.contratanteEmail,
  };
}
