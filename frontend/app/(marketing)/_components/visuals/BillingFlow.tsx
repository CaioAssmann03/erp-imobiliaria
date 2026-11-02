"use client";

import { animate, motion, motionValue, useInView, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** O número sobe de 0 a 100 uma vez, quando chega à tela, e fica flutuando no 100. */
const TARGET = 100;
const COUNT_SECONDS = 3.4;

/** Quantas cópias formam a espessura do número e a distância entre elas (px). */
const DEPTH_LAYERS = 9;
const DEPTH_STEP = 3;

/** As linhas finas dos prédios e do mapa: 3 px de cor, 1 px de fundo, por cima da face da frente. */
const SCANLINES = "repeating-linear-gradient(to bottom, transparent 0 3px, var(--color-canvas) 3px 4px)";
const FADE = "linear-gradient(to bottom, transparent 0, black 20%, black 80%, transparent 100%)";
const FACE = "var(--color-brand)";
const ONE = motionValue(1);
const SIDE = "color-mix(in oklab, var(--color-brand) 55%, var(--color-window-off))";

/** Passa de 0 a 1 suave entre `from` e `to`. */
const smooth = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** Quanto a coluna de um algarismo sobe (em % da sua altura de 11 casas: 0–9 mais um 0 para o 9 virar 0). */
function columnOffset(value: number, place: number) {
  const scaled = value / 10 ** place;
  const whole = Math.floor(scaled);
  const roll = place === 0 ? scaled - whole : smooth(0.7, 1, scaled - whole);
  return `${-(((whole % 10) + roll) / 11) * 100}%`;
}

/**
 * Um algarismo: uma coluna de 0 a 9 que rola até o valor, com a borda esmaecida em cima e embaixo. Os algarismos da
 * esquerda (`grow`, de 0 a 1) abrem de largura quando o número chega neles, para o conjunto ficar sempre centralizado.
 */
function Digit({ y, grow }: { y: MotionValue<string>; grow?: MotionValue<number> }) {
  const width = useTransform(grow ?? ONE, (amount) => `${amount * 0.62}em`);
  return (
    <motion.span
      className="relative inline-block h-[1.1em] overflow-hidden"
      style={{ width: grow ? width : "0.62em", opacity: grow, maskImage: FADE, WebkitMaskImage: FADE }}
    >
      <motion.span className="absolute inset-x-0 top-0 flex flex-col text-center" style={{ y }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((value, index) => (
          <span key={index} className="block h-[1.1em] leading-[1.1em]">
            {value}
          </span>
        ))}
      </motion.span>
    </motion.span>
  );
}

/**
 * Client Component: um número só, grande, flutuando em 3D: sobe de 0 a 100 de uma vez quando chega à tela (os algarismos
 * giram como um odômetro) e fica no "100%", balançando devagar no ar. O número tem espessura (cópias empilhadas em
 * profundidade, a da frente nas linhas laranja do site) e uma sombra no chão que acompanha. Sem texto e sem controles. Sem
 * movimento para quem prefere menos movimento (já no 100%, parado e levemente inclinado).
 */
export function BillingFlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref, { margin: "0px 0px -10% 0px" });
  const still = useLite();
  const value = useMotionValue(still ? TARGET : 0);
  const counted = useRef(false);
  const hundredsY = useTransform(value, (current) => columnOffset(current, 2));
  const tensY = useTransform(value, (current) => columnOffset(current, 1));
  const unitsY = useTransform(value, (current) => columnOffset(current, 0));
  const hundredsGrow = useTransform(value, (current) => smooth(99, 100, current));
  const tensGrow = useTransform(value, (current) => smooth(9, 10, current));

  // Sobe uma vez, na primeira vez que o número aparece.
  useEffect(() => {
    if (still) {
      value.set(TARGET);
      return;
    }
    if (!shown || counted.current) return;
    counted.current = true;
    animate(value, TARGET, { duration: COUNT_SECONDS, ease: [0.22, 1, 0.36, 1], delay: 0.4 });
  }, [shown, still, value]);

  const digits = (
    <>
      <Digit y={hundredsY} grow={hundredsGrow} />
      <Digit y={tensY} grow={tensGrow} />
      <Digit y={unitsY} />
      <span className="ml-[0.06em] text-[0.5em] tracking-normal">%</span>
    </>
  );
  const floating = shown && !still;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Exemplo: um número subindo de 0 a 100%"
      className={cn("flex min-h-72 w-full flex-col items-center justify-center gap-10 py-6 md:min-h-96", className)}
      style={{ perspective: 1100 }}
    >
      <motion.div
        aria-hidden
        className="relative"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, scale: 0.9, rotateX: 10, rotateY: -18 }}
        animate={
          floating
            ? { opacity: 1, scale: 1, rotateX: [10, -4], rotateY: [-18, 18], y: [-8, 10] }
            : { opacity: shown || still ? 1 : 0, scale: shown || still ? 1 : 0.9, rotateX: 6, rotateY: -14, y: 0 }
        }
        transition={
          floating
            ? { opacity: { duration: 0.8 }, scale: { duration: 1, ease: EASE }, default: { duration: 6.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } }
            : { duration: still ? 0 : 0.9, ease: EASE }
        }
      >
        {/* A espessura: cópias mais escuras para trás. */}
        {Array.from({ length: DEPTH_LAYERS }, (_, index) => (
          <div
            key={index}
            className="absolute inset-0 flex items-center justify-center text-[clamp(6rem,15vw,11rem)] leading-none font-bold tracking-[-0.04em] tabular-nums"
            style={{ color: SIDE, transform: `translateZ(${-(DEPTH_LAYERS - index) * DEPTH_STEP}px)` }}
          >
            {digits}
          </div>
        ))}
        {/* A face da frente, nas linhas laranja. */}
        <div className="relative flex items-center justify-center text-[clamp(6rem,15vw,11rem)] leading-none font-bold tracking-[-0.04em] tabular-nums" style={{ color: FACE }}>
          {digits}
          <span className="pointer-events-none absolute inset-0" style={{ backgroundImage: SCANLINES }} />
        </div>
      </motion.div>

      {/* A sombra no chão: diminui e esmaece quando o número sobe. */}
      <motion.div
        aria-hidden
        className="h-4 w-40 rounded-[50%]"
        style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-ink) 22%, transparent), transparent)" }}
        animate={floating ? { scaleX: [0.85, 1.1], opacity: [0.6, 1] } : { scaleX: 1, opacity: 1 }}
        transition={floating ? { duration: 6.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" } : { duration: 0 }}
      />
    </div>
  );
}
