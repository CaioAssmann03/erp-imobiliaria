"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

// O código é um recorte (máscara) de linhas horizontais, a mesma linguagem da skyline da landing.
const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 200;
const ROW_STEP = 6;
const ROW_THICKNESS = 3.4;
const ROWS = Math.floor(VIEW_HEIGHT / ROW_STEP);

/** Código do erro em linhas de varredura laranja: cada linha corre da esquerda, de cima para baixo; no hover, as linhas sob o ponteiro escurecem. */
export function ScanlineCode({ code, reduced }: { code: number; reduced: boolean | null }) {
  const maskId = useId();
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  function trackPointer(event: React.PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    setHoverRow(Math.floor(((event.clientY - box.top) / box.height) * ROWS));
  }

  return (
    <svg
      role="img"
      aria-label={`Erro ${code}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className="mx-auto h-auto w-[min(28rem,100%)] text-brand"
      onPointerMove={trackPointer}
      onPointerLeave={() => setHoverRow(null)}
    >
      <defs>
        <mask id={maskId}>
          <text
            x="0"
            y="172"
            fill="white"
            fontSize="206"
            fontWeight="800"
            letterSpacing="-4"
            style={{ fontFamily: "inherit", fontVariantNumeric: "tabular-nums" }}
          >
            {code}
          </text>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        {Array.from({ length: ROWS }, (_, row) => (
          <motion.rect
            key={row}
            x="0"
            y={row * ROW_STEP}
            width={VIEW_WIDTH}
            height={ROW_THICKNESS}
            fill={hoverRow !== null && Math.abs(row - hoverRow) <= 2 ? "var(--color-ink)" : "currentColor"}
            style={{ transformBox: "fill-box", transformOrigin: "left center", transition: "fill 0.25s" }}
            initial={reduced ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.55, delay: row * 0.022, ease: EASE }}
          />
        ))}
      </g>
    </svg>
  );
}
