"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { MetriLogo } from "@/components/brand/MetriLogo";
import { useLite } from "@/lib/theme/use-lite";

import { ACRONYM } from "@/app/(marketing)/_components/content";

type Phase = "logo" | "pills";
interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// Tudo em `em` (1em = o tamanho do texto do palco), para o desenho escalar junto com a tela.
const COUNT = ACRONYM.length;
const ROW_H = 1.55; // altura de uma pílula
const ROW_GAP = 0.5; // espaço entre pílulas, onde fica o pescoço que as une
const PAD_X = 0.55;
const NECK = 0.34;
const ZIGZAG = [1.8, 0, 1.8, 0, 1.8]; // quanto cada pílula é empurrada para a direita: o vai e vem da referência
const STAGE_HEIGHT = COUNT * ROW_H + (COUNT - 1) * ROW_GAP;

// Em segundos, a partir de o palco chegar à tela: a palavra do logo fica escrita e então as pílulas se formam, uma a uma.
const PILLS_AT = 1.4;
const PILL_STEP = 0.22;

/** A haste reta que une duas pílulas seguidas, no meio da faixa em que as duas se sobrepõem na horizontal. */
function neckPath(upper: Box, lower: Box, size: number): string | null {
  const w = NECK * size;
  const from = Math.max(upper.left, lower.left);
  const to = Math.min(upper.left + upper.width, lower.left + lower.width);
  if (to - from < w) return null;
  const n1 = (from + to) / 2 - w / 2;
  const o = 1; // entra 1px nas pílulas para não deixar fresta de antialias
  return `M${n1} ${upper.top + upper.height - o}H${n1 + w}V${lower.top + o}H${n1}Z`;
}

/**
 * A sigla METRI no começo de Recursos, em dois tempos, tudo no meio da tela: a palavra METRI do logo (sem a casa) e,
 * logo depois, ela dá lugar a cinco pílulas empilhadas, uma por palavra (Modelo, Eficiente de, Tempo e, Recursos,
 * Imobiliários), em vai e vem e ligadas por hastes retas, tudo de cantos retos. É onde a animação para. As fases andam
 * por tempo depois de o palco chegar à tela. No modo leve (e no movimento reduzido, que o liga) nada anima: já aparecem as
 * pílulas.
 */
export function AcronymReveal() {
  const stage = useRef<HTMLDivElement>(null);
  const pills = useRef<(HTMLDivElement | null)[]>([]);
  const shown = useInView(stage, { once: true, amount: 0.3 });
  const still = useLite();
  const [phase, setPhase] = useState<Phase>("logo");
  const [necks, setNecks] = useState<(string | null)[]>([]);
  const [shift, setShift] = useState(0); // quanto empurrar o conjunto para a direita para ele ficar no meio do palco

  useEffect(() => {
    if (!shown) return;
    const toPills = setTimeout(() => setPhase("pills"), PILLS_AT * 1000);
    return () => clearTimeout(toPills);
  }, [shown]);

  // Mede as pílulas (já com o texto na fonte carregada) para desenhar os pescoços entre elas e centrar o conjunto.
  useLayoutEffect(() => {
    const node = stage.current;
    if (!node) return;
    function measure() {
      const size = parseFloat(getComputedStyle(node!).fontSize);
      // O topo e a altura vêm da conta (o `offset*` arredonda para o pixel e deixaria um degrau na junção); a largura, do texto.
      const boxes = pills.current.map((pill, index) =>
        pill
          ? {
              left: (ZIGZAG[index] ?? 0) * size,
              top: index * (ROW_H + ROW_GAP) * size,
              width: pill.offsetWidth,
              height: ROW_H * size,
            }
          : null,
      );
      const width = Math.max(0, ...boxes.map((box) => (box ? box.left + box.width : 0)));
      setShift(Math.max(0, (node!.clientWidth - width) / 2));
      setNecks(boxes.slice(1).map((lower, index) => (boxes[index] && lower ? neckPath(boxes[index], lower, size) : null)));
    }
    measure();
    void document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const current: Phase = still ? "pills" : phase;
  const start = still ? false : undefined;

  return (
    <section aria-labelledby="acronym-title" className="mx-auto w-full max-w-6xl px-6 pt-36">
      <h1 id="acronym-title" className="sr-only">
        Recursos do METRI: o que o nome significa e o que o sistema faz
      </h1>
      <div
        ref={stage}
        className="relative text-[clamp(1.75rem,5.2vw,4.25rem)] leading-none tracking-[-0.02em]"
        style={{ height: `${STAGE_HEIGHT}em` }}
      >
        {/* 1. A palavra do logo, no meio do palco. */}
        <motion.div
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink"
          initial={start}
          animate={{ opacity: current === "logo" ? 1 : 0, y: current === "logo" ? 0 : -12 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <MetriLogo house={false} className="h-[1.6em] w-auto" />
        </motion.div>

        {/* O conjunto das pílulas e dos pescoços, centrado no palco. */}
        <div className="absolute inset-0" style={{ transform: `translateX(${shift}px)` }}>
          {/* 2. Os pescoços que ligam as pílulas, cada um crescendo depois da pílula de baixo. */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-ink">
            {necks.map((d, index) =>
              d ? (
                <motion.path
                  key={ACRONYM[index + 1].letter}
                  d={d}
                  fill="currentColor"
                  style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
                  initial={start === false ? false : { opacity: 0, scaleY: 0 }}
                  animate={current === "pills" ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
                  transition={{ delay: current === "pills" ? (index + 1) * PILL_STEP + 0.35 : 0, duration: 0.4, ease: EASE }}
                />
              ) : null,
            )}
          </svg>

          {/* 3. As pílulas, uma por palavra (o rótulo da linha lê a palavra inteira). */}
          <ol className="relative flex flex-col" style={{ gap: `${ROW_GAP}em` }}>
            {ACRONYM.map((item, index) => {
              const then = "then" in item ? item.then : null;
              const word = `${item.letter}${item.rest}`;
              return (
                <li key={item.letter} aria-label={then ? `${word} ${then}` : word} style={{ height: `${ROW_H}em` }}>
                  <motion.div
                    ref={(node) => {
                      pills.current[index] = node;
                    }}
                    aria-hidden
                    className="relative inline-flex h-full items-center whitespace-nowrap bg-ink text-ink-foreground"
                    style={{
                      marginLeft: `${ZIGZAG[index]}em`,
                      paddingInline: `${PAD_X}em`,
                      transformOrigin: "0% 50%",
                    }}
                    initial={start === false ? false : { opacity: 0, scale: 0.6 }}
                    animate={current === "pills" ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                    transition={{ delay: current === "pills" ? index * PILL_STEP : 0, duration: 0.55, ease: EASE }}
                  >
                    <span className="font-medium">{word}</span>
                    {then && <span className="ml-[0.3em] text-[0.55em] font-medium opacity-60">{then}</span>}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
