"use client";

import { motion } from "motion/react";

import { useLite } from "@/lib/theme/use-lite";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * O título de uma página de módulo: uma palavra só, enorme, em negrito apertado, que sobe de dentro de uma máscara letra
 * por letra quando a página abre (o mesmo gesto do título da home). Parado para quem prefere menos movimento.
 */
export function StoryTitle({ children }: { children: string }) {
  const still = useLite();
  return (
    <h1 aria-label={children} className="text-[clamp(2.75rem,11.5vw,9.5rem)] leading-[1.05] font-bold tracking-[-0.05em] whitespace-nowrap">
      {children.split("").map((letter, index) => (
        <span key={index} aria-hidden className="inline-block overflow-hidden align-bottom pb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={still ? false : { y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.1 + index * 0.05, ease: EASE }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
