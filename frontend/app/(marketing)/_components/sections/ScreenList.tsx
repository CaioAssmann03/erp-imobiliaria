"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { SCREENS } from "@/app/(marketing)/_components/content";

const EASE = [0.22, 1, 0.36, 1] as const;

export const STEP_SECONDS = 5.5;

export type Step = { screen: number; point: number };

type ScreenListProps = {
  step: Step;
  /** O passeio automático está andando: a linha laranja do ponto da vez se desenha. */
  running: boolean;
  onPick: (step: Step) => void;
};

/**
 * As telas como títulos grandes; só a da vez abre, com a frase e os pontos. Dos pontos só o termo fica à vista: a descrição
 * aparece no ponto da vez, ao lado da guia fina onde corre a linha laranja do tempo.
 */
export function ScreenList({ step, running, onPick }: ScreenListProps) {
  const still = useReducedMotion();
  const fade = { duration: still ? 0 : 0.35, ease: EASE };

  return (
    <ol className="space-y-1">
      {SCREENS.map((screen, index) => {
        const open = index === step.screen;
        return (
          <li key={screen.key}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onPick({ screen: index, point: 0 })}
              className="group block w-full py-2 text-left outline-none"
            >
              <span className={cn("font-display text-title font-normal transition-colors", open ? "text-ink" : "text-ink-faint group-hover:text-ink-soft")}>
                {screen.title}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: still ? 0 : 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 pt-1 text-body text-ink-soft">{screen.lead}</p>
                  <ul className="mb-6 border-l border-ink/10">
                    {screen.points.map((point, pointIndex) => {
                      const active = pointIndex === step.point;
                      return (
                        <li key={point.term} className="relative">
                          {active && running && (
                            <motion.span
                              key={`${step.screen}-${step.point}`}
                              aria-hidden
                              className="absolute -left-px top-0 h-full w-px origin-top bg-brand"
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: STEP_SECONDS, ease: "linear" }}
                            />
                          )}
                          <button
                            type="button"
                            aria-current={active}
                            onClick={() => onPick({ screen: index, point: pointIndex })}
                            className="block w-full py-2.5 pl-5 text-left outline-none"
                          >
                            <span className={cn("text-label transition-colors", active ? "text-ink" : "text-ink-faint")}>{point.term}</span>
                          </button>
                          <AnimatePresence initial={false}>
                            {active && (
                              <motion.p
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={fade}
                                className="overflow-hidden pl-5 text-body text-ink-soft"
                              >
                                <span className="block pb-3">{point.text}</span>
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ol>
  );
}
