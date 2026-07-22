"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

function wrap(min: number, max: number, v: number) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}

export function ScrollVelocityMarquee({
  children,
  baseVelocity = 3,
  className,
}: {
  children: ReactNode;
  baseVelocity?: number;
  className?: string;
}) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, (v) => {
    const sign = v < 0 ? -1 : 1;
    return sign * Math.min(5, (Math.abs(v) / 1000) * 5);
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [numCopies, setNumCopies] = useState(2);

  const baseX = useMotionValue(0);
  const unitWidth = useMotionValue(0);
  const isInViewRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const block = blockRef.current;
    if (!container || !block) return;

    const updateSizes = () => {
      const cw = container.offsetWidth || 0;
      const bw = block.scrollWidth || 0;
      unitWidth.set(bw);
      setNumCopies(bw > 0 ? Math.max(3, Math.ceil(cw / bw) + 2) : 2);
    };
    updateSizes();

    const ro = new ResizeObserver(updateSizes);
    ro.observe(container);
    ro.observe(block);

    const io = new IntersectionObserver(([entry]) => {
      if (entry) isInViewRef.current = entry.isIntersecting;
    });
    io.observe(container);

    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, [unitWidth]);

  const x = useTransform([baseX, unitWidth], ([v, bw]) => {
    const width = Number(bw) || 1;
    return `${-wrap(0, width, Number(v) || 0)}px`;
  });

  useAnimationFrame((_, delta) => {
    if (!isInViewRef.current) return;
    const dt = delta / 1000;
    const vf = velocityFactor.get();
    const speedMultiplier = 1 + Math.min(5, Math.abs(vf));
    const bw = unitWidth.get() || 0;
    if (bw <= 0) return;
    const pixelsPerSecond = (bw * baseVelocity) / 100;
    baseX.set(baseX.get() + pixelsPerSecond * speedMultiplier * dt);
  });

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden whitespace-nowrap ${className ?? ""}`}
    >
      <motion.div
        className="inline-flex w-max transform-gpu select-none items-center will-change-transform"
        style={{ x }}
      >
        {Array.from({ length: numCopies }).map((_, i) => (
          <div
            aria-hidden={i !== 0}
            className="inline-flex shrink-0 items-center"
            key={i}
            ref={i === 0 ? blockRef : null}
          >
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
