"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Flame } from "lucide-react";
import { useNotifications, type ToastItem } from "@/app/lib/realtime/NotificationProvider";

const ICONE_POR_TIPO: Record<string, string> = {
  "reuniao.marcada": "🔥",
};

export function ToastManager() {
  const { toasts, remover } = useNotifications();

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => remover(t.id)} />
        ))}
      </AnimatePresence>
    </div>
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
      <span className="mt-0.5 text-lg leading-none">
        {ICONE_POR_TIPO[item.tipo] ?? <Flame className="h-4 w-4 text-roxo-light" />}
      </span>
      <p className="min-w-0 flex-1 text-sm leading-snug text-gelo">{item.mensagem}</p>
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
