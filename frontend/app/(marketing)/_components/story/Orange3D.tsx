"use client";

import { motion, useInView } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** As linhas finas do hero: 3 px de cor, 1 de vão. */
const lines = (color: string) => `repeating-linear-gradient(to bottom, ${color} 0, ${color} 3px, transparent 3px, transparent 4px)`;

type Entrance = "wipe" | "turn" | "zoom";

/**
 * Uma foto ilustrativa (obra, dinheiro, contas) no efeito laranja do site: a imagem já vem em tons de laranja (tingida na
 * hora de gerar o arquivo, sem filtro nem mistura de cores no navegador) e é vista pela persiana de linhas finas. Cada foto entra de um jeito: `wipe` (uma cortina da esquerda para a direita), `turn` (gira no espaço vindo
 * do lado, como uma folha) ou `zoom` (abre do centro e aproxima).
 */
export function ScanPhoto({ src, entrance, side = "right", aspect = "aspect-[4/5]", focus = "50% 50%", className }: { src: StaticImageData; entrance: Entrance; side?: "left" | "right"; aspect?: string; focus?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const on = shown || still;
  const sign = side === "left" ? -1 : 1;

  const initial = {
    wipe: { clipPath: "inset(0 100% 0 0)", opacity: 1, rotateY: 0, x: 0, scale: 1 },
    turn: { clipPath: "inset(0 0 0 0)", opacity: 0, rotateY: 75 * sign, x: 90 * sign, scale: 0.95 },
    zoom: { clipPath: "inset(48% 48% 48% 48%)", opacity: 1, rotateY: 0, x: 0, scale: 1 },
  }[entrance];
  const final = { clipPath: "inset(0 0% 0 0%)", opacity: 1, rotateY: entrance === "turn" ? -9 * sign : 0, x: 0, scale: 1 };

  return (
    <div ref={ref} className={className} style={{ perspective: 1100 }}>
      <motion.div
        initial={false}
        animate={on ? final : initial}
        transition={{ duration: still ? 0 : entrance === "zoom" ? 1.4 : 1.5, ease: EASE }}
        className={cn("relative isolate w-full overflow-hidden", aspect)}
      >
        <Image src={src} alt="" className="size-full object-cover" style={{ objectPosition: focus }} sizes="(min-width: 1280px) 330px, 90vw" />
        <span className="absolute inset-0" style={{ background: "repeating-linear-gradient(to bottom, transparent 0, transparent 3px, var(--color-canvas) 3px, var(--color-canvas) 4px)" }} />
      </motion.div>
    </div>
  );
}

/** As três cores das faces de um bloco: a da frente, a do lado (mais escura) e a de cima (mais clara), nas linhas finas do site. */
const FACES = {
  solid: {
    front: { backgroundColor: "color-mix(in oklab, var(--color-brand) 16%, var(--color-canvas))", backgroundImage: lines("var(--color-brand)") },
    side: { backgroundColor: "color-mix(in oklab, var(--color-brand) 30%, #1c1b19)", backgroundImage: lines("color-mix(in oklab, var(--color-brand) 58%, #1c1b19)") },
    top: { backgroundColor: "color-mix(in oklab, var(--color-brand) 30%, var(--color-canvas))", backgroundImage: lines("color-mix(in oklab, var(--color-brand) 55%, white)") },
  },
  ghost: {
    front: { backgroundColor: "color-mix(in oklab, var(--color-ink) 5%, transparent)", backgroundImage: lines("color-mix(in oklab, var(--color-ink) 16%, transparent)") },
    side: { backgroundColor: "color-mix(in oklab, var(--color-ink) 9%, transparent)", backgroundImage: lines("color-mix(in oklab, var(--color-ink) 24%, transparent)") },
    top: { backgroundColor: "color-mix(in oklab, var(--color-ink) 3%, transparent)", backgroundImage: lines("color-mix(in oklab, var(--color-ink) 10%, transparent)") },
  },
} as const;

/** Um bloco em 3D de CSS, de largura `w`, profundidade `d` e altura `h` (px): três faces, a da frente, a do lado e a de cima. */
function Cuboid({ w, d, h, tone }: { w: number; d: number; h: number; tone: keyof typeof FACES }) {
  const faces = FACES[tone];
  const face = { position: "absolute" as const, backfaceVisibility: "hidden" as const };
  return (
    <div style={{ width: w, height: h, position: "relative", transformStyle: "preserve-3d" }}>
      <div style={{ ...face, inset: 0, transform: `translateZ(${d / 2}px)`, ...faces.front }} />
      <div style={{ ...face, top: 0, left: (w - d) / 2, width: d, height: h, transform: `rotateY(90deg) translateZ(${w / 2}px)`, ...faces.side }} />
      <div style={{ ...face, left: 0, top: (h - d) / 2, width: w, height: d, transform: `rotateX(90deg) translateZ(${h / 2}px)`, ...faces.top }} />
    </div>
  );
}

const VIEW = "rotateX(-26deg) rotateY(-34deg)";
/** O valor de cada unidade num lançamento dividido de um jeito (o do modo individual), que dá a altura de cada coluna. */
const VALUES = [120, 180, 150, 240, 90, 150, 200, 150];

/** Oito colunas em 3D, uma por unidade, cada uma da altura do que a unidade paga, que sobem do chão uma depois da outra. */
export function IsoBars({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -18% 0px" });
  const on = shown || still;
  return (
    <div ref={ref} aria-hidden className={cn("flex h-[19rem] items-end justify-center overflow-visible pb-10", className)} style={{ perspective: 1200 }}>
      <div style={{ transformStyle: "preserve-3d", transform: VIEW }} className="flex items-end gap-4">
        {VALUES.map((value, index) => (
          <motion.div
            key={index}
            initial={false}
            animate={{ y: on ? 0 : 130, opacity: on ? 1 : 0 }}
            transition={{ duration: still ? 0 : 1.1, delay: still ? 0 : index * 0.09, ease: EASE }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Cuboid w={26} d={26} h={value * 0.82} tone="solid" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
