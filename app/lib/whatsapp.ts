// Helpers de telefone/WhatsApp (BR). Decide o DDI pelo TAMANHO do número, não
// por prefixo — um "startsWith('55')" ingênuo dá falso positivo pro DDD 55
// (Santa Maria/RS), que também começa com 55 sem ser o DDI do Brasil.
export function soDigitos(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

// Garante o DDI 55 presente exatamente uma vez.
export function numeroWhatsappBR(raw: string): string {
  const digitos = soDigitos(raw);
  if (!digitos) return "";
  // Sem DDI: DDD (2) + fixo (8) = 10 dígitos, ou DDD (2) + celular (9) = 11.
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  // Já com DDI: 55 + fixo (10) = 12, ou 55 + celular (11) = 13.
  if (digitos.length === 12 || digitos.length === 13) return digitos;
  // Tamanho atípico: se já parece ter DDI (começa com 55 e é longo o
  // suficiente), mantém; senão, prefixa por melhor esforço.
  if (digitos.startsWith("55") && digitos.length >= 12) return digitos;
  return `55${digitos}`;
}

// Abertura padrão de toda abordagem de prospecção via WhatsApp.
export function mensagemAbordagemInicial(nomeUsuario: string): string {
  return `Olá, me chamo ${nomeUsuario}, sou diretor comercial da Boechat Company e preciso fazer um convite para o responsável, ele se encontra?`;
}

export function linkWhatsapp(raw: string, mensagem?: string): string {
  const numero = numeroWhatsappBR(raw);
  if (!numero) return "";
  const query = mensagem ? `?text=${encodeURIComponent(mensagem)}` : "";
  return `https://wa.me/${numero}${query}`;
}
