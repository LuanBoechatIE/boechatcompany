"use client";

// Som sintetizado via Web Audio (dois tons curtos, tipo "ding" do Slack) em
// vez de um arquivo de áudio — zero asset pra carregar/hospedar, funciona
// offline, e dá pra trocar o timbre só ajustando os números aqui.
const CHAVE_SOM_LIGADO = "boechat_notif_som";

export function somLigado(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(CHAVE_SOM_LIGADO);
  return v === null ? true : v === "1";
}

export function definirSomLigado(ligado: boolean): void {
  window.localStorage.setItem(CHAVE_SOM_LIGADO, ligado ? "1" : "0");
}

let ctx: AudioContext | null = null;

export function tocarSomNotificacao(): void {
  if (!somLigado()) return;
  try {
    ctx ??= new AudioContext();
    const agora = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const inicio = agora + i * 0.09;
      gain.gain.setValueAtTime(0, inicio);
      gain.gain.linearRampToValueAtTime(0.12, inicio + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.22);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.24);
    });
  } catch {
    // navegador pode bloquear áudio sem interação prévia do usuário — ok ignorar
  }
}

export function vibrarNotificacao(): void {
  try {
    navigator.vibrate?.(60);
  } catch {
    // no-op (desktop não tem vibrate)
  }
}
