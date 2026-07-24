"use client";

// Fica entre o transporte (RealtimeProvider) e a UI (ToastManager/Bell).
// Registro central de "quais eventos geram toast": pra um evento novo virar
// notificação visual no futuro (lead perdido, contrato assinado...), só
// precisa entrar nesse array — nada mais muda.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useRealtimeEvent, type EventoRealtime } from "./RealtimeProvider";
import { tocarSomNotificacao, vibrarNotificacao } from "./som";

const TIPOS_COM_TOAST = ["reuniao.marcada", "chamada.rapida"];
const DURACAO_MS = 5000;
// Chamada rápida é urgente — fica mais tempo na tela que um toast comum.
const DURACAO_POR_TIPO: Record<string, number> = { "chamada.rapida": 20000 };

export type ToastItem = EventoRealtime & { id: string };

type NotificationContextValue = {
  toasts: ToastItem[];
  remover: (id: string) => void;
  ultimoEventoEm: number;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ultimoEventoEm, setUltimoEventoEm] = useState(0);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remover = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const adicionar = useCallback(
    (evento: EventoRealtime) => {
      const id = `${evento.tipo}-${evento.criadoEm}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((t) => [...t, { ...evento, id }]);
      setUltimoEventoEm(Date.now());
      tocarSomNotificacao();
      vibrarNotificacao();
      const duracao = DURACAO_POR_TIPO[evento.tipo] ?? DURACAO_MS;
      timers.current.set(id, setTimeout(() => remover(id), duracao));
    },
    [remover],
  );

  // Cada tipo em TIPOS_COM_TOAST precisa de um hook fixo (regra dos hooks
  // não deixa fazer isso em loop dinâmico) — cresce aqui se entrar tipo novo.
  useRealtimeEvent(TIPOS_COM_TOAST[0], adicionar);
  useRealtimeEvent(TIPOS_COM_TOAST[1], adicionar);

  return (
    <NotificationContext.Provider value={{ toasts, remover, ultimoEventoEm }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications precisa estar dentro de <NotificationProvider>");
  return ctx;
}
