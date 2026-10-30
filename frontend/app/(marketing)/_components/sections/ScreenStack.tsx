"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { SCREENS } from "@/app/(marketing)/_components/content";
import { ScreenFrame } from "./ScreenFrame";
import { ScreenList, STEP_SECONDS, type Step } from "./ScreenList";

const EASE = [0.22, 1, 0.36, 1] as const;

/** O passo seguinte do passeio: o próximo ponto da tela e, no último, a primeira da tela seguinte (volta ao início no fim). */
function nextStep({ screen, point }: Step): Step {
  if (point + 1 < SCREENS[screen].points.length) return { screen, point: point + 1 };
  return { screen: (screen + 1) % SCREENS.length, point: 0 };
}

/**
 * Telas reais do sistema em passeio guiado: a imagem aproxima a região de cada ponto e, a cada ~5 s, segue para o próximo
 * (a linha laranja do ponto mostra o tempo). O passeio para quando o ponteiro está sobre a seção, fora da tela ou ao
 * primeiro clique: um título, um ponto ou a própria imagem (que alterna zoom e tela inteira) passam o controle a quem lê.
 */
export function ScreenStack() {
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const visible = useInView(ref, { margin: "-15% 0px -15% 0px" });
  const still = useReducedMotion();
  const [step, setStep] = useState<Step>({ screen: 0, point: 0 });
  const [zoomed, setZoomed] = useState(true);
  const [touring, setTouring] = useState(true);
  const [hovering, setHovering] = useState(false);
  const running = touring && visible && !hovering && !still;
  const focus = SCREENS[step.screen].points[step.point].focus;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setStep(nextStep), STEP_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [running, step]);

  function pick(next: Step) {
    setStep(next);
    setZoomed(true);
    setTouring(false);
  }

  return (
    <section
      ref={ref}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-24 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start lg:gap-14"
    >
      <motion.div
        initial={false}
        animate={{ opacity: seen ? 1 : 0, y: seen ? 0 : 32 }}
        transition={{ duration: still ? 0 : 0.8, ease: EASE }}
        className="lg:order-2 lg:sticky lg:top-24"
      >
        <ScreenFrame
          current={step.screen}
          focus={zoomed ? focus : null}
          onToggle={() => {
            setZoomed((value) => !value);
            setTouring(false);
          }}
        />
      </motion.div>
      <div className="lg:order-1">
        <ScreenList step={step} running={running} onPick={pick} />
      </div>
    </section>
  );
}
