// Gera o token único do cliente (vai no link de onboarding).
// Aleatório e não-enumerável: quem não tem o link não acessa.

export function newToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

// slug de campo estável a partir do label (fallback pra aleatório se vazio).
export function fieldId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "f_" + Buffer.from(bytes).toString("base64url");
}
