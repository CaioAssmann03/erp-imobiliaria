"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { zoomTransform, type ScreenFocus } from "@/lib/theme/screen-zoom";
import extrato from "@/public/marketing/extrato.png";
import inadimplencia from "@/public/marketing/inadimplencia.png";
import painel from "@/public/marketing/painel.png";
import unidades from "@/public/marketing/unidades.png";

import { SCREENS } from "@/app/(marketing)/_components/content";

const EASE = [0.22, 1, 0.36, 1] as const;
const IMAGES = [painel, unidades, extrato, inadimplencia];

type ScreenFrameProps = {
  current: number;
  /** A região em foco; `null` mostra a tela inteira. */
  focus: ScreenFocus | null;
  onToggle: () => void;
};

/** A tela da vez, aproximada na região em foco. As quatro imagens ficam empilhadas e trocam por fade; um clique alterna zoom e tela inteira. */
export function ScreenFrame({ current, focus, onToggle }: ScreenFrameProps) {
  const still = useReducedMotion();
  const { scale, x, y } = zoomTransform(focus);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={focus ? "Ver a tela inteira" : "Aproximar a região"}
      className={cn(
        "relative block aspect-[1440/900] w-full overflow-hidden rounded-sharp bg-surface shadow-float ring-1 ring-ink/10 outline-none focus-visible:ring-2 focus-visible:ring-brand",
        focus ? "cursor-zoom-out" : "cursor-zoom-in",
      )}
    >
      <motion.div
        initial={false}
        animate={{ scale, x: `${x}%`, y: `${y}%` }}
        transition={{ duration: still ? 0 : 0.9, ease: EASE }}
        style={{ transformOrigin: "0 0" }}
        className="absolute inset-0"
      >
        {SCREENS.map((entry, index) => (
          <motion.div
            key={entry.key}
            initial={false}
            animate={{ opacity: index === current ? 1 : 0 }}
            transition={{ duration: still ? 0 : 0.5, ease: EASE }}
            className="absolute inset-0"
          >
            <Image src={IMAGES[index]} alt={entry.alt} sizes="(min-width: 1024px) 1440px, 180vw" className="block h-full w-full" />
          </motion.div>
        ))}
      </motion.div>
    </button>
  );
}
