"use client";

import { useEffect, useRef, useState } from "react";

import { renderBuilding } from "@/lib/ascii-building";
import { cn } from "@/lib/utils";

const START_ANGLE = 0.6;
const SPEED = 0.55; // radianos por segundo
const FRAME_MS = 1000 / 24;

/** Tinta clara (tema escuro)? Lê a cor de texto real, então acompanha qualquer tema. */
function isLightInk(element: HTMLElement) {
  const channels = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length < 3) return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return (channels[0] + channels[1] + channels[2]) / 3 > 128;
}

/**
 * Client Component: prédio 3D em arte ASCII girando. O quadro inicial é determinístico
 * (igual no servidor e no navegador); a animação começa depois de montar e fica parada
 * para quem prefere menos movimento.
 */
export function AsciiBuilding({ className }: { className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [frame, setFrame] = useState(() => renderBuilding({ angle: START_ANGLE }));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lightOnDark = isLightInk(element);
    let animation = 0;
    let last = 0;
    let frames = 0;
    const startedAt = performance.now();

    const draw = (now: number) => {
      animation = requestAnimationFrame(draw);
      if (now - last < FRAME_MS) return;
      last = now;
      if (++frames % 48 === 0) lightOnDark = isLightInk(element); // acompanha troca de tema
      const angle = START_ANGLE + ((now - startedAt) / 1000) * SPEED;
      setFrame(renderBuilding({ angle, lightOnDark }));
    };

    if (reduceMotion) {
      setFrame(renderBuilding({ angle: START_ANGLE, lightOnDark }));
    } else {
      animation = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <pre
      ref={ref}
      role="img"
      aria-label="Ilustração de um prédio girando, feita de caracteres"
      className={cn(
        "font-mono text-[6px] leading-[1.1] whitespace-pre text-ink select-none sm:text-[8px]",
        className
      )}
    >
      {frame}
    </pre>
  );
}
