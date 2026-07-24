// Biblioteca de mensagens das notificações. Nada de mensagem fixa: cada
// disparo escolhe uma aleatória (com personalidade, gíria, deboche leve) do
// pool certo — o objetivo é a plataforma parecer viva, não um sistema de
// toast genérico.

function sortear<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

function comNome(template: string, nome: string): string {
  return template.replaceAll("{nome}", nome);
}

const REUNIAO_GENERICA = [
  "🚨 CARALHOOOOO!! {nome} meteu mais uma reunião!!",
  "🔥 {nome} NÃO PARA, PORRAAAAA!!",
  "🚀 MAIS UMAAAA!! {nome} acabou de marcar outra reunião!!",
  "⚡ {nome} tá voando hoje!!",
  "💣 O homem simplesmente decidiu vender!!",
  "🎯 {nome} colocou mais uma reunião na agenda!!",
  "🚨 SEGURA ESSE MALUCO!!",
  "🔥 MAIS UMA NO BOLSO!!",
  "🏆 {nome} tá destruindo hoje!!",
  "🚀 O CRM acabou de cantar mais uma reunião!!",
  "💥 MAIS UMAAAAAAA!!",
  "👀 Alguém segura o {nome}.",
  "🔥 O bicho tá impossível hoje.",
  "🚨 A máquina tá funcionando!!",
  "⚡ {nome} acabou de colocar mais uma reunião no calendário!!",
];

const REUNIAO_1 = [
  "🎯 {nome} abriu os trabalhos!",
  "🚀 Começou bem! Primeira reunião do dia!",
  "🔥 O expediente nem esquentou e já saiu reunião!",
];

const REUNIAO_2 = [
  "👀 Já é a segunda hein...",
  "🔥 {nome} tá embalando!",
  "🚀 O homem acordou querendo trabalhar.",
];

const REUNIAO_3 = [
  "💣 MAIS UMAAAA!!",
  "🔥 O bicho tá pegando.",
  "⚡ Tá impossível hoje.",
];

const REUNIAO_5 = [
  "🚨 ALERTA! {nome} acabou de marcar a quinta reunião hoje!!",
  "💀 O CRM tá pedindo arrego.",
  "🔥 ESSE MALUCO TÁ INSANO!!",
  "🚀 Alguém dá água pro homem!!",
];

const REUNIAO_10 = [
  "☠ ISSO NÃO É UM VENDEDOR, É UMA MÁQUINA.",
  "🚨 DEZ REUNIÕES HOJE, CARALHOOOOOO!!",
  "🔥 CHAMA O RH, ESSE CARA É UM MONSTRO.",
  "🏆 O homem simplesmente decidiu vender hoje.",
];

// Escolhe o pool pelo "degrau" de contagem do dia: exatamente 1/2/3/5/10 tem
// mensagem própria, o resto (4, 6-9, 11+) cai no pool genérico.
function poolPorContagem(contagemHoje: number): string[] {
  if (contagemHoje === 1) return REUNIAO_1;
  if (contagemHoje === 2) return REUNIAO_2;
  if (contagemHoje === 3) return REUNIAO_3;
  if (contagemHoje === 5) return REUNIAO_5;
  if (contagemHoje >= 10) return REUNIAO_10;
  return REUNIAO_GENERICA;
}

export function mensagemReuniaoMarcada(nome: string, contagemHoje: number): string {
  return comNome(sortear(poolPorContagem(contagemHoje)), nome);
}
