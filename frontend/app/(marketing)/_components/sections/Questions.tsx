"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { QUESTIONS } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";

/**
 * Posição de cada card (mesma ordem de `QUESTIONS.items`) na grade de 4 colunas do desktop; as linhas têm altura
 * fixa, então o clique troca o conteúdo sem mexer nos vizinhos. Abaixo de `lg` os cards empilham com altura livre.
 *
 *   A A B C
 *   A A D C
 *   E F F G
 */
const AREAS = [
  "sm:col-span-2 lg:row-span-2",
  "",
  "lg:row-span-2",
  "",
  "",
  "sm:col-span-2",
  "",
];

/**
 * Faixa de ponta a ponta, escura (`bg-ink`, como o `SiteFooter`) com
 * cards de tamanhos diferentes e uma pergunta como título. Clicar abre a resposta no próprio card (ele inverte, claro
 * sobre a faixa escura); clicar de novo fecha. O primeiro já começa aberto para a seção não aparecer toda fechada.
 */
export function Questions() {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set([0]));
  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <section className="bg-ink text-ink-foreground">
      <div className="mx-auto w-full max-w-6xl px-6 py-24">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-display text-section text-balance">{QUESTIONS.title}</h2>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:auto-rows-[14rem] lg:grid-cols-4">
          {QUESTIONS.items.map((item, index) => {
            const isOpen = open.has(index);
            return (
              <Reveal key={item.title} delay={index * 0.05} className={`min-h-44 lg:min-h-0 ${AREAS[index]}`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(index)}
                  className={`flex h-full w-full cursor-pointer flex-col justify-between gap-6 overflow-hidden rounded-sharp border p-6 text-left transition-colors duration-300 ${
                    isOpen ? "border-ink-foreground bg-ink-foreground text-ink" : "border-ink-foreground/20 hover:bg-ink-foreground/10"
                  }`}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="font-display text-title font-normal text-balance">{item.title}</span>
                    <span aria-hidden className={`text-2xl leading-none font-light ${isOpen ? "text-ink/50" : "text-ink-foreground/50"}`}>
                      {isOpen ? "−" : "+"}
                    </span>
                  </span>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.span
                        key="answer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3 }}
                        className="block max-w-[46ch] text-[0.9375rem] leading-[1.55] text-ink/75"
                      >
                        {item.text}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
