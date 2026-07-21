// Presets padrão das ofertas da Boechat.
// Usados pela ação seedPresetsPadrao (botão "Criar presets padrão" no admin).
// Inserção é idempotente por NOME: rodar de novo não duplica.
import type { FieldDef, FieldType } from "./types";

export type PresetSeed = { nome: string; descricao: string; campos: FieldDef[] };

// helper enxuto pra montar campo
const f = (
  id: string,
  label: string,
  tipo: FieldType,
  obrigatorio = false,
  extra?: { opcoes?: string[]; ajuda?: string },
): FieldDef => ({ id, label, tipo, obrigatorio, ...extra });

export const PRESETS_PADRAO: PresetSeed[] = [
  // 1. SITE (front-end / caixa)
  {
    nome: "Site",
    descricao: "Coleta pra montar o site (braço de caixa).",
    campos: [
      f("negocio", "Nome do negócio", "texto", true),
      f("responsavel", "Seu nome (quem está preenchendo)", "texto", true),
      f("sobre", "Sobre o negócio", "textarea", true, {
        ajuda: "Um parágrafo: história e o que torna vocês diferentes.",
      }),
      f("servicos", "Serviços / diferenciais", "textarea", true, {
        ajuda: "De 3 a 6 principais, o que vocês mais querem destacar.",
      }),
      f("publico", "Quem é o cliente de vocês?", "texto"),
      f("horario", "Horário de funcionamento", "texto"),
      f("endereco", "Endereço (se atende presencial)", "texto"),
      f("contato", "Contatos", "textarea", true, {
        ajuda: "WhatsApp, telefone, Instagram e outras redes.",
      }),
      f("cor", "Preferência de cor / identidade", "texto", false, {
        ajuda: "Se já tiver uma cor ou identidade definida.",
      }),
      f("dominio", "Domínio", "texto", false, {
        ajuda: "Já tem um? Qual? Ou quer que a gente registre um.",
      }),
      f("logo", "Logo em alta", "link", false, {
        ajuda: "Link do arquivo (Drive/WeTransfer). De preferência vetor (.ai/.svg/.pdf) ou PNG grande.",
      }),
      f("fotos", "Fotos", "link", false, {
        ajuda: "Link com fotos do negócio, equipe e ambiente.",
      }),
      f("referencias", "Sites de referência (opcional)", "textarea", false, {
        ajuda: "Links de sites que vocês gostam.",
      }),
    ],
  },

  // 2. ABERTURA COMPLETA (lançamento, 5 frentes)
  {
    nome: "Abertura Completa",
    descricao: "Lançamento de abertura: presença, página, conteúdo, tráfego e estratégia.",
    campos: [
      f("negocio", "Nome do negócio", "texto", true),
      f("responsavel", "Seu nome (quem está preenchendo)", "texto", true),
      f("sobre", "Sobre o negócio / o que estão abrindo", "textarea", true),
      f("diferencial", "Por que alguém escolheria vocês, e não o concorrente comum?", "textarea", true, {
        ajuda: "Em uma ou duas frases.",
      }),
      f("publico", "Quem é o público de vocês?", "texto", true),
      f("planos", "Estrutura dos planos", "textarea", true, {
        ajuda: "Valores e o que cada plano inclui.",
      }),
      f("meta", "Meta de clientes na pré-venda", "numero", true),
      f("data_abertura", "Data prevista de abertura", "data", true),
      f("cores", "Cores da marca", "texto", true, {
        ajuda: "Códigos (ex.: #6D28D9) ou uma referência visual.",
      }),
      f("logo", "Logo em alta", "link", true, {
        ajuda: "Link do arquivo (Drive/WeTransfer).",
      }),
      f("fotos_obra", "Fotos da obra e do maquinário", "link", true, {
        ajuda: "Link com as fotos atuais.",
      }),
      f("fotos_equipe", "Fotos de vocês / da equipe", "link", false, {
        ajuda: "Pros bastidores da jornada de abertura.",
      }),
      f("instagram", "@ do Instagram", "texto", true),
      f("acesso_ig", "Consegue dar acesso de admin no Instagram?", "sim_nao", false, {
        ajuda: "Se não, a gente devolve o conteúdo pronto pra vocês postarem.",
      }),
      f("whatsapp_lead", "WhatsApp que vai receber os contatos da pré-venda", "texto", true),
      f("pagamento", "Como querem receber o pagamento dos clientes?", "texto", true, {
        ajuda: "Ex.: chave PIX, pra deixar configurada na página.",
      }),
    ],
  },

  // 3. TRÁFEGO (gestão de anúncio)
  {
    nome: "Tráfego",
    descricao: "Gestão de tráfego pago (setup + campanha).",
    campos: [
      f("negocio", "Nome do negócio", "texto", true),
      f("responsavel", "Seu nome (quem está preenchendo)", "texto", true),
      f("objetivo", "Objetivo da campanha", "textarea", true, {
        ajuda: "O que vocês querem: mais contato, pré-venda, agendamento...",
      }),
      f("oferta", "Qual a oferta que vamos anunciar?", "textarea", true, {
        ajuda: "Plano, promoção, o que a pessoa recebe.",
      }),
      f("regiao", "Região a atingir", "texto", true, {
        ajuda: "Cidade/bairro e raio aproximado.",
      }),
      f("publico", "Quem é o público ideal?", "textarea", false, {
        ajuda: "Idade, interesses, perfil.",
      }),
      f("verba", "Verba de anúncio disponível por mês", "texto", true, {
        ajuda: "A verba é paga direto por vocês na plataforma, separada do serviço.",
      }),
      f("destino", "Pra onde o anúncio manda a pessoa?", "link", true, {
        ajuda: "Link da página, WhatsApp ou Instagram.",
      }),
      f("bm", "Já têm Gerenciador de Negócios (Business Manager) do Meta?", "sim_nao", true),
      f("acesso", "Acessos", "textarea", false, {
        ajuda: "Como vamos ter acesso à conta de anúncio e às redes.",
      }),
      f("criativos", "Material pra criativos", "link", false, {
        ajuda: "Fotos e vídeos que podemos usar nos anúncios (link).",
      }),
    ],
  },

  // 4. SISTEMA (back-end)
  {
    nome: "Sistema (back-end)",
    descricao: "Sistema sob medida: Agenda Cheia, Resposta Imediata ou Funil de Retorno.",
    campos: [
      f("negocio", "Nome do negócio", "texto", true),
      f("responsavel", "Seu nome (quem está preenchendo)", "texto", true),
      f("sistema", "Qual sistema?", "select", true, {
        opcoes: [
          "Agenda Cheia (agendamento + anti no-show)",
          "Resposta Imediata (atendimento que qualifica e agenda)",
          "Funil de Retorno (recupera quem não fechou)",
          "Mais de um / ainda não sei",
        ],
      }),
      f("processo_atual", "Como funciona hoje?", "textarea", true, {
        ajuda: "Descreve o processo atual: como agenda, atende, cobra follow-up.",
      }),
      f("dor", "Onde mais dói / o que mais perde hoje?", "textarea", true),
      f("volume", "Volume por mês", "texto", false, {
        ajuda: "Quantos contatos / agendamentos / orçamentos por mês, aproximadamente.",
      }),
      f("ferramentas", "Ferramentas que usam hoje", "textarea", false, {
        ajuda: "Ex.: WhatsApp, planilha, agenda no papel, algum sistema.",
      }),
      f("integracoes", "Precisa integrar com algo?", "textarea", false, {
        ajuda: "Ex.: WhatsApp, agenda, sistema que já usam.",
      }),
      f("acesso", "Acessos necessários", "textarea", false, {
        ajuda: "O que vamos precisar acessar pra montar.",
      }),
    ],
  },

  // 5. DARK KITCHEN
  {
    nome: "Dark Kitchen",
    descricao: "Estruturação de delivery / dark kitchen (done-for-you).",
    campos: [
      f("negocio", "Nome da operação", "texto", true),
      f("responsavel", "Seu nome (quem está preenchendo)", "texto", true),
      f("faturamento", "Faturamento atual do delivery por mês", "texto", true),
      f("marcas", "Quais marcas / cardápios vocês têm hoje?", "textarea", true),
      f("cozinha", "Estrutura da cozinha", "textarea", true, {
        ajuda: "Tamanho, equipe e capacidade de produção.",
      }),
      f("ifood", "Já vendem no iFood?", "sim_nao", true),
      f("acesso_ifood", "Acesso ao gestor do iFood", "textarea", false, {
        ajuda: "Como vamos ter acesso pra configurar.",
      }),
      f("cardapio", "Cardápio atual", "link", true, {
        ajuda: "Link com cardápio, fotos dos pratos e preços.",
      }),
      f("meta", "Onde querem chegar?", "textarea", false, {
        ajuda: "Meta de faturamento / ambição.",
      }),
      f("whatsapp", "WhatsApp da operação", "texto", false, {
        ajuda: "Pra migração de clientes iFood para o WhatsApp.",
      }),
    ],
  },
];
