"use client";

import { motion } from "framer-motion";

type Token = string | { w: string; className?: string };

export function WordReveal({
  tokens,
  className,
  as: As = "h2",
}: {
  tokens: Token[];
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  return (
    <As className={className}>
      <motion.span
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        transition={{ staggerChildren: 0.08 }}
        className="inline"
      >
        {tokens.map((t, i) => {
          const word = typeof t === "string" ? t : t.w;
          const cls = typeof t === "string" ? "" : t.className ?? "";
          return (
            <span
              key={i}
              className="inline-block overflow-hidden whitespace-nowrap align-bottom"
            >
              <motion.span
                className={`inline-block ${cls}`}
                variants={{
                  hidden: { y: "110%", opacity: 0 },
                  show: {
                    y: "0%",
                    opacity: 1,
                    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                {word}
              </motion.span>
              {i < tokens.length - 1 && <span>&nbsp;</span>}
            </span>
          );
        })}
      </motion.span>
    </As>
  );
}
