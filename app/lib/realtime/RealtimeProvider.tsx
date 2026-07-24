"use client";

// Camada de transporte, isolada do resto. Ninguém fora deste arquivo sabe
// que existe Pusher — quem quiser reagir a um evento usa `useRealtime()` e
// recebe {tipo, mensagem, ...}. Se um dia o transporte mudar (outro provedor,
// WebSocket próprio), só este arquivo muda.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type EventoRealtime = {
  tipo: string;
  mensagem: string;
  criadoEm: string;
  [chave: string]: unknown;
};

type Handler = (evento: EventoRealtime) => void;

type RealtimeContextValue = {
  conectado: boolean;
  subscribe: (tipo: string, handler: Handler) => () => void;
};

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const CANAL_EQUIPE = "boechat-equipe";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [conectado, setConectado] = useState(false);
  const handlersRef = useRef(new Map<string, Set<Handler>>());

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return; // sem env pública, real-time simplesmente não liga (fail-soft)

    let pusher: import("pusher-js").default | null = null;
    let canal: import("pusher-js").Channel | null = null;
    let ativo = true;

    import("pusher-js").then(({ default: Pusher }) => {
      if (!ativo) return;
      pusher = new Pusher(key, { cluster });
      canal = pusher.subscribe(CANAL_EQUIPE);
      canal.bind_global((tipo: string, payload: EventoRealtime) => {
        if (tipo.startsWith("pusher:")) return;
        handlersRef.current.get(tipo)?.forEach((h) => h(payload));
      });
      pusher.connection.bind("state_change", (states: { current: string }) => {
        setConectado(states.current === "connected");
      });
    });

    return () => {
      ativo = false;
      canal?.unbind_all();
      pusher?.unsubscribe(CANAL_EQUIPE);
      pusher?.disconnect();
    };
  }, []);

  function subscribe(tipo: string, handler: Handler): () => void {
    if (!handlersRef.current.has(tipo)) handlersRef.current.set(tipo, new Set());
    handlersRef.current.get(tipo)!.add(handler);
    return () => handlersRef.current.get(tipo)?.delete(handler);
  }

  return (
    <RealtimeContext.Provider value={{ conectado, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime precisa estar dentro de <RealtimeProvider>");
  return ctx;
}

// Atalho pra escutar um tipo de evento específico dentro de um componente.
export function useRealtimeEvent(tipo: string, handler: Handler): void {
  const { subscribe } = useRealtime();
  useEffect(() => subscribe(tipo, handler), [tipo, subscribe, handler]);
}
