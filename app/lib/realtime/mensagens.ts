// Biblioteca de mensagens das notificações. Nada de mensagem fixa: cada
// disparo escolhe uma aleatória (com personalidade, gíria, deboche leve) do
// pool certo — o objetivo é a plataforma parecer viva, não um sistema de
// toast genérico. Regra dura: toda mensagem cita o {nome} E deixa explícito
// que foi reunião marcada — nunca só "segura esse maluco" sem dizer quem
// fez o quê.

function sortear<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

function comNome(template: string, nome: string): string {
  return template.replaceAll("{nome}", nome);
}

const REUNIAO_GENERICA = [
  "🚨 CARALHOOOOO!! {nome} meteu mais uma reunião!!",
  "🔥 {nome} NÃO PARA DE MARCAR REUNIÃO, PORRAAAAA!!",
  "🚀 MAIS UMAAAA!! {nome} acabou de marcar outra reunião!!",
  "⚡ {nome} tá voando hoje, mais uma reunião marcada!!",
  "💣 {nome} decidiu vender: reunião marcada!!",
  "🎯 {nome} colocou mais uma reunião na agenda!!",
  "🚨 SEGURA O {nome}, MARCOU MAIS UMA REUNIÃO!!",
  "🔥 {nome} meteu mais uma reunião no bolso!!",
  "🏆 {nome} tá destruindo hoje: outra reunião marcada!!",
  "🚀 O CRM acabou de cantar mais uma reunião de {nome}!!",
  "💥 {nome} MARCOU MAIS UMAAAAAAA REUNIÃO!!",
  "👀 Alguém segura o {nome}, já é outra reunião marcada.",
  "🔥 {nome} tá impossível hoje: mais uma reunião marcada.",
  "🚨 A máquina do {nome} tá funcionando: reunião marcada!!",
  "⚡ {nome} colocou mais uma reunião no calendário!!",
];

const REUNIAO_1 = [
  "🎯 {nome} abriu os trabalhos: primeira reunião marcada hoje!",
  "🚀 {nome} começou bem, primeira reunião do dia marcada!",
  "🔥 O expediente nem esquentou e {nome} já marcou reunião!",
];

const REUNIAO_2 = [
  "👀 {nome} já marcou a segunda reunião hoje...",
  "🔥 {nome} tá embalando: segunda reunião marcada!",
  "🚀 {nome} acordou querendo trabalhar, já são 2 reuniões marcadas.",
];

const REUNIAO_3 = [
  "💣 {nome} MARCOU MAIS UMAAAA, já são 3 reuniões marcadas hoje!!",
  "🔥 {nome} tá pegando fogo: 3 reuniões marcadas hoje.",
  "⚡ Tá impossível hoje: {nome} já marcou 3 reuniões.",
];

const REUNIAO_5 = [
  "🚨 ALERTA! {nome} acabou de marcar a quinta reunião hoje!!",
  "💀 {nome} tá deixando o CRM pedir arrego: 5 reuniões marcadas.",
  "🔥 {nome} TÁ INSANO: 5 reuniões marcadas hoje!!",
  "🚀 Alguém dá água pro {nome}, já são 5 reuniões marcadas!!",
];

const REUNIAO_10 = [
  "☠ {nome} NÃO É VENDEDOR, É MÁQUINA: 10 reuniões marcadas hoje.",
  "🚨 {nome} MARCOU DEZ REUNIÕES HOJE, CARALHOOOOOO!!",
  "🔥 CHAMA O RH: {nome} marcou 10 reuniões hoje.",
  "🏆 {nome} decidiu vender hoje: 10 reuniões marcadas.",
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
