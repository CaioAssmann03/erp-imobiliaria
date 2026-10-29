"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import painel from "@/public/marketing/painel.png";
import unidades from "@/public/marketing/unidades.png";

import { SCREENS } from "./content";

const EASE = [0.22, 1, 0.36, 1] as const;
const IMAGES = [painel, unidades];

const item = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  out: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

/**
 * Uma tela real do sistema por vez, à esquerda, com dois rótulos embaixo para trocar de tela (a imagem some e a outra
 * entra); à direita, só o texto da tela da vez: uma frase e três pontos, sem fios nem colunas. A tela sobe quando a
 * seção entra.
 */
export function ScreenStack() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const still = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const screen = SCREENS[current];

  return (
    <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-24 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
      <div ref={ref}>
        <motion.div
          initial={false}
          animate={{ opacity: seen ? 1 : 0, y: seen ? 0 : 32 }}
          transition={{ duration: still ? 0 : 0.8, ease: EASE }}
          className="relative aspect-[1440/900] w-full overflow-hidden rounded-card bg-surface shadow-float ring-1 ring-ink/10"
        >
          {SCREENS.map((entry, index) => (
            <motion.div
              key={entry.key}
              initial={false}
              animate={{ opacity: index === current ? 1 : 0 }}
              transition={{ duration: still ? 0 : 0.5, ease: EASE }}
              className="absolute inset-0"
            >
              <Image src={IMAGES[index]} alt={entry.alt} sizes="(min-width: 1024px) 560px, 90vw" className="block h-full w-full" />
            </motion.div>
          ))}
        </motion.div>

        <div role="tablist" aria-label="Telas do sistema" className="mt-6 flex gap-6">
          {SCREENS.map((entry, index) => (
            <button
              key={entry.key}
              type="button"
              role="tab"
              aria-selected={index === current}
              onClick={() => setCurrent(index)}
              className={cn("text-label transition-colors", index === current ? "text-ink" : "text-ink-faint hover:text-ink-soft")}
            >
              {entry.title}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[23rem]" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={screen.key} initial="hidden" animate="shown" exit="out" transition={{ staggerChildren: still ? 0 : 0.08 }}>
            <motion.p variants={item} className="text-[1.0625rem] leading-[1.7] text-ink">
              {screen.lead}
            </motion.p>
            <ul className="mt-8 space-y-6">
              {screen.points.map((point) => (
                <motion.li key={point.term} variants={item}>
                  <span className="text-label text-ink">{point.term}</span>
                  <span className="mt-1.5 block text-body text-ink-soft">{point.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
