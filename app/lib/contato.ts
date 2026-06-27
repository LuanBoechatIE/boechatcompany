export const WHATSAPP_NUMBER = "353894771267";
export const INSTAGRAM_HANDLE = "boechatcompany";
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export function whatsappLink(message: string) {
  const params = new URLSearchParams({ text: message });
  return `https://wa.me/${WHATSAPP_NUMBER}?${params.toString()}`;
}

export const WA_AGENDAR = whatsappLink(
  "Oi, Boechat. Quero conversar sobre vender mais sem aumentar a verba de anúncio.",
);
