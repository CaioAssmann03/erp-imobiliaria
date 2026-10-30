"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { SUMMARY } from "@/app/(marketing)/_components/content";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Resumo logo abaixo do hero: um texto formal sobre o que é o sistema, como a página de um livro: uma única coluna
 * centralizada e estreita, com todos os parágrafos iguais (mesmo tamanho e peso), justificados e hifenizados. Entra por
 * tempo, quando chega à tela: uma linha fina se desenha de um lado ao outro e, em seguida, os parágrafos sobem um a um.
 * Estático para quem prefere menos movimento.
 */
export function Summary() {
  const ref = useRef<HTMLElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const still = useReducedMotion();
  const on = still || shown;

  /** Um bloco do texto sobe e aparece; `index` escalona a entrada. */
  const rise = (index: number) => ({
    initial: false as const,
    animate: { opacity: on ? 1 : 0, y: on ? 0 : 18 },
    transition: { duration: 0.8, delay: still ? 0 : 0.5 + index * 0.18, ease: EASE },
  });

  return (
    <section ref={ref} lang="pt-BR" className="mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
      <div className="relative pt-10 md:pt-12">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/15" />
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="absolute inset-x-0 top-0 h-px origin-left bg-ink"
        />

        <div className="mx-auto max-w-2xl">
          {[SUMMARY.lead, ...SUMMARY.paragraphs].map((paragraph, index) => (
            <motion.p
              key={paragraph}
              {...rise(index)}
              className="mb-7 text-justify text-[1.1875rem] leading-[1.75] text-ink hyphens-auto last:mb-0"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
