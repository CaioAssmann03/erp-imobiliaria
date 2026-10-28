"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import painel from "@/public/marketing/painel.png";

import { TOUR_STEPS } from "./tour-steps";

const EASE = [0.22, 1, 0.36, 1] as const;
const DIM = "shadow-[0_0_0_9999px_color-mix(in_oklab,var(--color-ink)_45%,transparent)]";

/**
 * O print real do painel, preso na tela enquanto a rolagem percorre três áreas: o destaque se move para cada
 * uma (o resto escurece) e, acima do print, um rótulo e uma frase curta dizem o que ela é.
 */
export function ProductTour() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [current, setCurrent] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (value) =>
    setCurrent(Math.min(TOUR_STEPS.length - 1, Math.floor(value * TOUR_STEPS.length))),
  );
  const step = TOUR_STEPS[current];

  return (
    <section ref={ref} aria-labelledby="tour-titulo" className="relative h-[320svh]">
      <div className="sticky top-0 mx-auto flex h-svh max-w-6xl flex-col justify-center px-6 pt-16">
        <div className="mb-6 flex min-h-12 flex-col gap-1 md:flex-row md:items-baseline md:gap-6">
          <p id="tour-titulo" className="text-label text-ink-faint tabular-nums">
            {String(current + 1).padStart(2, "0")} / {String(TOUR_STEPS.length).padStart(2, "0")}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={step.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="text-heading"
            >
              <span className="text-label text-brand">{step.label}</span>
              <span className="ml-4 text-ink">{step.line}</span>
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="relative overflow-hidden rounded-card shadow-float">
          <Image src={painel} alt="Painel do sistema: resumo da carteira, contas a pagar e pendências" priority={false} sizes="(min-width: 1152px) 1104px, 100vw" className="block h-auto w-full" />
          <AnimatePresence>
            {step.area && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  left: `${step.area.left}%`,
                  top: `${step.area.top}%`,
                  width: `${step.area.width}%`,
                  height: `${step.area.height}%`,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
                className={`pointer-events-none absolute rounded-panel ring-2 ring-brand ${DIM}`}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
