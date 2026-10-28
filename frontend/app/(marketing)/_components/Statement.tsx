"use client";

import { motion, type MotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { STATEMENT } from "./content";

/** Parte do progresso da seção em que as frases entram; o resto fica com o texto inteiro à vista. */
const REVEAL_SPAN = 0.85;

/**
 * Seção de texto logo abaixo do hero: um parágrafo em serifa, frase por frase. Cada frase sobe um pouco e ganha
 * opacidade no seu trecho da rolagem. O espaço no topo (45svh) é a faixa de pixels que escorre do hero.
 * Estático para quem prefere menos movimento.
 */
export function Statement() {
  const ref = useRef<HTMLElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.65"] });

  return (
    <section ref={ref} aria-labelledby="proposta-titulo" className="mx-auto w-full max-w-6xl px-6 pt-[calc(45svh+3rem)] pb-28 md:pb-40">
      <p id="proposta-titulo" className="text-label text-brand">
        A proposta
      </p>
      <p className="mt-6 max-w-4xl font-display text-section">
        {STATEMENT.map((sentence, index) => (
          <Sentence key={sentence} index={index} progress={scrollYProgress} still={still}>
            {sentence}
          </Sentence>
        ))}
      </p>
    </section>
  );
}

interface SentenceProps {
  index: number;
  progress: MotionValue<number>;
  still: boolean | null;
  children: string;
}

function Sentence({ index, progress, still, children }: SentenceProps) {
  const slice = REVEAL_SPAN / STATEMENT.length;
  // Os trechos se sobrepõem um pouco: a próxima frase começa antes da anterior terminar, sem degraus.
  const range = [index * slice, (index + 1.4) * slice];
  const opacity = useTransform(progress, range, [0.08, 1]);
  const y = useTransform(progress, range, [18, 0]);

  return (
    <motion.span style={still ? undefined : { opacity, y }} className="mt-4 block first:mt-0">
      {children}
    </motion.span>
  );
}
