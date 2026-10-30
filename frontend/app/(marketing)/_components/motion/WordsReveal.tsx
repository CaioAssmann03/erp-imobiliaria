"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { Fragment, useRef } from "react";

/**
 * Título que entra palavra por palavra, cada uma subindo de dentro de uma máscara, quando chega à tela. Quem observa
 * a chegada é o contêiner: uma palavra ainda escondida pela máscara não é vista pelo observador.
 */
export function WordsReveal({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const still = useReducedMotion();
  if (still) return <>{text}</>;

  return (
    <span ref={ref}>
      {text.split(" ").map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden pb-[0.14em] align-bottom [margin-bottom:-0.14em]">
            <motion.span
              className="inline-block"
              initial={false}
              animate={{ y: shown ? 0 : "115%" }}
              transition={{ duration: 0.85, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>{" "}
        </Fragment>
      ))}
    </span>
  );
}
