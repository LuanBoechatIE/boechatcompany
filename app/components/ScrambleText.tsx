"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*+-";

export function ScrambleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  function scramble() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += 1;
      setDisplay(
        text
          .split("")
          .map((ch, i) => {
            if (ch === " ") return " ";
            if (i < progress) return ch;
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join(""),
      );
      if (progress >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, 28);
  }

  function reset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplay(text);
  }

  return (
    <span onMouseEnter={scramble} onMouseLeave={reset} className={className}>
      {display}
    </span>
  );
}
