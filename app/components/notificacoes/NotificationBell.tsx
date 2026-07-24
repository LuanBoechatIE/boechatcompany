"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotifications } from "@/app/lib/realtime/NotificationProvider";

export function NotificationBell({ className = "" }: { className?: string }) {
  const { ultimoEventoEm } = useNotifications();
  const [piscando, setPiscando] = useState(false);
  const primeiraRef = useRef(true);

  useEffect(() => {
    if (primeiraRef.current) {
      primeiraRef.current = false;
      return;
    }
    if (!ultimoEventoEm) return;
    setPiscando(true);
    const t = setTimeout(() => setPiscando(false), 1200);
    return () => clearTimeout(t);
  }, [ultimoEventoEm]);

  return (
    <motion.span
      className={`inline-flex ${className}`}
      animate={piscando ? { rotate: [0, -12, 10, -6, 0], color: "#c084fc" } : { rotate: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Bell className="h-4 w-4" />
    </motion.span>
  );
}
