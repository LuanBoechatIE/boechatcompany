"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2 } from "lucide-react";
import { iniciarChamadaRapida } from "@/app/admin/calendario-actions";

// Só renderizado pra superadmin (checado no AdminShell, quem monta este
// componente) — mesmo assim o server action confere de novo (exigirSuperAdmin),
// nunca confia só na UI escondida.
export function ChamadaRapidaBotao() {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");

  function chamar() {
    setErro("");
    startTransition(async () => {
      const r = await iniciarChamadaRapida();
      if (!r.ok) {
        setErro(r.erro ?? "Não deu pra iniciar a chamada.");
        return;
      }
      if (r.meetLink) window.open(r.meetLink, "_blank", "noopener,noreferrer");
      if (r.erro) setErro(r.erro);
      else if (!r.meetLink) setErro("Reunião avisada, mas sem Google Calendar conectado não gerou link de Meet.");
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-2">
      <AnimatePresence>
        {erro && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="max-w-[260px] rounded-xl border border-yellow-500/30 bg-ink-soft/90 p-3 text-xs text-yellow-100/90 shadow-xl backdrop-blur-xl"
          >
            {erro}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={chamar}
        disabled={pending}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chamada rápida com a equipe"
        title="Chamada rápida (abre Meet e avisa a equipe)"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-roxo text-white shadow-2xl shadow-roxo/30 transition-opacity disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Phone className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
