"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Os blocos do desenho (ilustrativos): quantos andares cada um tem e o tom do bloco, tirado dos tokens do destaque. */
const BLOCKS = [
  { name: "A", floors: 5, tone: "var(--color-brand-strong)" },
  { name: "B", floors: 7, tone: "var(--color-brand)" },
  { name: "C", floors: 6, tone: "var(--color-brand-light)" },
] as const;
const PER_FLOOR = 2;
/** Escala de todos os tempos da entrada (atrasos e durações): menor é mais rápido. */
const PACE = 0.65;
const IDLE_CAPTION = "Condomínio › blocos › unidades";

/** As linhas horizontais do skyline (3 px cheios a cada 4) na cor do bloco. A casinha tem 48 ou 56 px por dentro (da borda), múltiplos de 4, para as linhas fecharem certas. */
const scanlines = (tone: string) => `repeating-linear-gradient(to bottom, ${tone} 0 3px, transparent 3px 4px)`;

interface Hover {
  block: string;
  unit?: string;
}

/**
 * Client Component: a hierarquia do cadastro, como um desenho. Um colchete no topo é o condomínio; sob ele ficam os blocos,
 * cada um uma coluna com o seu título; e dentro de cada bloco, as unidades, uma casinha numerada por andar. Ao chegar à
 * tela, o colchete se desenha, os blocos aparecem da esquerda para a direita e as unidades vão sendo "cadastradas": cada
 * casinha se preenche com as linhas laranja do skyline, em onda. O mouse destaca o bloco e a unidade sob ele e a legenda
 * diz o caminho ("Condomínio › Bloco B › Unidade 302"). Já montado para quem prefere menos movimento.
 */
export function CondominiumPlan({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const still = useLite();
  const on = still || shown;
  const [hover, setHover] = useState<Hover | null>(null);

  const caption = hover
    ? ["Condomínio", `Bloco ${hover.block}`, ...(hover.unit ? [`Unidade ${hover.unit}`] : [])].join(" › ")
    : IDLE_CAPTION;

  /** Aparece (opacidade e subida curta) no tempo `delay`; sem animação quando a pessoa prefere menos movimento. */
  const appear = (delay: number) => ({
    initial: false as const,
    animate: { opacity: on ? 1 : 0, y: on ? 0 : 8 },
    transition: { duration: 0.6 * PACE, delay: still ? 0 : delay * PACE, ease: EASE },
  });

  return (
    <div ref={ref} aria-hidden className={className} onPointerLeave={() => setHover(null)}>
      {/* O condomínio: um colchete que cobre todos os blocos. */}
      <motion.p {...appear(0)} className="text-label text-ink">
        Condomínio
      </motion.p>
      <div className="relative mt-2 h-2.5">
        <motion.span
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={{ duration: 0.9 * PACE, delay: still ? 0 : 0.15 * PACE, ease: EASE }}
          className="absolute inset-0 origin-left border-x border-t border-ink"
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 md:gap-5">
        {BLOCKS.map((block, blockIndex) => {
          const dimmed = hover !== null && hover.block !== block.name;
          return (
            <div
              key={block.name}
              onPointerEnter={() => setHover({ block: block.name })}
              className={cn("transition-opacity duration-300", dimmed && "opacity-35")}
            >
              <motion.p {...appear(0.4 + blockIndex * 0.15)} className="border-b border-ink/25 pb-2 text-label text-ink">
                Bloco {block.name}
              </motion.p>
              <div className="mt-3 grid grid-cols-2 gap-1">
                {Array.from({ length: block.floors * PER_FLOOR }, (_, index) => {
                  const floor = Math.floor(index / PER_FLOOR);
                  const unit = `${floor + 1}0${(index % PER_FLOOR) + 1}`;
                  const active = hover?.block === block.name && hover.unit === unit;
                  const drawn = 0.9 + blockIndex * 0.15 + floor * 0.07;
                  const filled = 1.7 + blockIndex * 0.25 + floor * 0.14 + (index % PER_FLOOR) * 0.06;
                  return (
                    <motion.span
                      key={unit}
                      {...appear(drawn)}
                      onPointerEnter={() => setHover({ block: block.name, unit })}
                      onPointerLeave={() => setHover({ block: block.name })}
                      className="relative block h-[50px] border border-ink/25 md:h-[58px]"
                    >
                      <motion.span
                        initial={false}
                        animate={{ clipPath: on ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
                        transition={{ duration: 0.5 * PACE, delay: still ? 0 : filled * PACE, ease: EASE }}
                        className="absolute inset-0"
                        style={{ backgroundImage: active ? undefined : scanlines(block.tone), backgroundColor: active ? "var(--color-ink)" : undefined }}
                      />
                    </motion.span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 border-t border-ink/20 pt-3 text-label text-ink-faint">{caption}</p>
    </div>
  );
}
