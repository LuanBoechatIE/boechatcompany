"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useNotifications, type ToastItem } from "@/app/lib/realtime/NotificationProvider";

export function ToastManager() {
  const { toasts, remover } = useNotifications();

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => remover(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Rótulo estrutural do evento. Fica FORA da mensagem sorteada de propósito:
// a mensagem é a gracinha (varia), esta linha é a informação (nunca varia).
// Assim "quem foi" e "o que aconteceu" ficam garantidos mesmo que uma
// mensagem nova entre no pool sem citar nome/reunião.
function Rotulo({ item }: { item: ToastItem }) {
  const nome = typeof item.nome === "string" ? item.nome : "";
  const contagem = typeof item.contagemHoje === "number" ? item.contagemHoje : 0;
  if (item.tipo !== "reuniao.marcada" || !nome) return null;

  return (
    <p className="mt-1 text-xs text-gelo-dim">
      <span className="font-medium text-gelo">{nome}</span> marcou reunião
      {contagem > 0 && ` · ${contagem}ª hoje`}
    </p>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
      className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/10 bg-ink-soft/70 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="min-w-0 flex-1">
        {/* A mensagem já vem com emoji próprio — nada de ícone extra aqui. */}
        <p className="text-sm leading-snug text-gelo">{item.mensagem}</p>
        <Rotulo item={item} />
      </div>
      <button
        onClick={onClose}
        className="shrink-0 rounded-full p-1 text-gelo-dim/70 transition-colors hover:bg-white/10 hover:text-gelo"
        aria-label="Fechar notificação"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
