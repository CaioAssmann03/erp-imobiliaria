"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Um exemplo, em milhares de reais por mês: tudo o que foi lançado nos boletos e a parte que se repete (parcelas e "todo mês"). */
const SERIES = [
  { key: "launched", label: "Lançado", color: "var(--color-brand)", dash: undefined, values: [3.2, 3.8, 6.1, 4.4, 5.2, 5.8, 4.1, 5.6, 4.7, 5.1, 6.4, 7.2] },
  { key: "recurring", label: "Recorrente", color: "color-mix(in oklab, var(--color-ink) 45%, transparent)", dash: "5 5", values: [2.8, 3, 3.4, 3.9, 4.2, 4.4, 3.6, 3.9, 4.1, 4.3, 4.6, 4.8] },
] as const;
const TICKS = [0, 2, 4, 6, 8];
const TOP = 8;
const LAST = MONTHS.length - 1;

const MARGIN = { top: 12, right: 12, bottom: 30, left: 44 };
const money = (value: number) => `R$ ${value.toFixed(1).replace(".", ",")} mil`;

/** Uma curva que passa por todos os pontos sem passar do alcance deles (spline cúbica monótona), como os gráficos de painel. */
function smoothLine(points: readonly [number, number][]) {
  const n = points.length;
  const dx = points.slice(1).map((point, i) => point[0] - points[i][0]);
  const slope = points.slice(1).map((point, i) => (point[1] - points[i][1]) / dx[i]);
  const tangent = points.map((_, i) => (i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const size = a * a + b * b;
    if (size > 9) {
      const scale = 3 / Math.sqrt(size);
      tangent[i] = scale * a * slope[i];
      tangent[i + 1] = scale * b * slope[i];
    }
  }
  let path = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    path += ` C ${x0 + dx[i] / 3} ${y0 + (tangent[i] * dx[i]) / 3} ${x1 - dx[i] / 3} ${y1 - (tangent[i + 1] * dx[i]) / 3} ${x1} ${y1}`;
  }
  return path;
}

/**
 * Client Component: um gráfico de linhas dos lançamentos de um ano, no estilo de um painel: duas linhas (o lançado em cada
 * mês, em laranja, e a parte recorrente, tracejada), grade fina, valores no eixo, sem legenda solta (os nomes ficam no topo,
 * com os valores do mês sob o ponteiro). Quando chega à tela as linhas se revelam da esquerda para a direita; passar o mouse
 * (ou o dedo) trava uma linha vertical no mês mais próximo, com um ponto em cada linha. Medido em pixels, para o texto
 * ficar nítido em qualquer largura. Os números são só um exemplo. Sem movimento para quem prefere menos movimento.
 */
export function EntryChart({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const still = useLite();
  const on = still || shown;
  const clipId = `entry-chart-${useId().replace(/:/g, "")}`;
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = width >= 768 ? 320 : 240;
  const plot = { x: MARGIN.left, y: MARGIN.top, w: Math.max(0, width - MARGIN.left - MARGIN.right), h: height - MARGIN.top - MARGIN.bottom };
  const px = (index: number) => plot.x + (index / LAST) * plot.w;
  const py = (value: number) => plot.y + plot.h - (value / TOP) * plot.h;
  const lines = SERIES.map((series) => smoothLine(series.values.map((value, i) => [px(i), py(value)] as [number, number])));
  const area = `${lines[0]} L ${px(LAST)} ${py(0)} L ${px(0)} ${py(0)} Z`;

  const pick = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const index = Math.round(((event.clientX - box.left - plot.x) / plot.w) * LAST);
    setActive(Math.min(LAST, Math.max(0, index)));
  };

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div aria-hidden className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 text-sm">
        <ul className="flex flex-wrap gap-x-8 gap-y-2">
          {SERIES.map((series) => (
            <li key={series.key} className="flex items-baseline gap-2">
              <span className="relative top-[-0.15em] inline-block h-0 w-5 border-t-2" style={{ borderColor: series.color, borderStyle: series.dash ? "dashed" : "solid" }} />
              <span className="text-ink-soft">{series.label}</span>
              <span className="min-w-[5.5rem] text-ink tabular-nums transition-opacity duration-200" style={{ opacity: active === null ? 0 : 1 }}>
                {money(series.values[active ?? LAST])}
              </span>
            </li>
          ))}
        </ul>
        <span className="text-label text-ink-faint">{active === null ? "exemplo" : MONTHS[active]}</span>
      </div>

      <div className="mt-6" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label="Exemplo: o valor lançado nos boletos em cada mês de um ano, em milhares de reais, e a parte recorrente"
            className="touch-pan-y select-none"
            onPointerMove={pick}
            onPointerDown={pick}
            onPointerLeave={() => setActive(null)}
            onPointerCancel={() => setActive(null)}
          >
            <defs>
              <clipPath id={clipId}>
                <motion.rect x={0} y={0} height={height} initial={false} animate={{ width: on ? width : 0 }} transition={{ duration: still ? 0 : 1.9, ease: EASE }} />
              </clipPath>
            </defs>

            {/* A grade e os valores do eixo. */}
            {TICKS.map((tick) => (
              <g key={tick}>
                <line x1={plot.x} x2={plot.x + plot.w} y1={py(tick)} y2={py(tick)} stroke="var(--color-ink)" strokeOpacity={tick === 0 ? 0.3 : 0.1} />
                <text x={plot.x - 12} y={py(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--color-ink-faint)" className="tabular-nums">
                  {tick === 0 ? "0" : `${tick} mil`}
                </text>
              </g>
            ))}
            {MONTHS.map((month, index) => (
              <text
                key={month}
                x={px(index)}
                y={plot.y + plot.h + 20}
                textAnchor="middle"
                fontSize={11}
                fill={active === index ? "var(--color-ink)" : "var(--color-ink-faint)"}
                style={{ transition: "fill 0.2s" }}
              >
                {width >= 640 ? month : month[0]}
              </text>
            ))}

            <g clipPath={`url(#${clipId})`}>
              <path d={area} fill="var(--color-brand)" fillOpacity={0.07} />
              {SERIES.map((series, k) => (
                <path key={series.key} d={lines[k]} fill="none" stroke={series.color} strokeWidth={series.dash ? 1.5 : 2.25} strokeDasharray={series.dash} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </g>

            {/* O mês sob o ponteiro: uma linha fina e um ponto em cada linha, que deslizam de um mês a outro. */}
            <g
              style={{ transform: `translateX(${px(active ?? LAST)}px)`, transition: "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)", opacity: on ? 1 : 0 }}
            >
              <line y1={plot.y} y2={plot.y + plot.h} stroke="var(--color-ink)" strokeOpacity={active === null ? 0 : 0.25} style={{ transition: "stroke-opacity 0.2s" }} />
              {SERIES.map((series) => (
                <circle
                  key={series.key}
                  cx={0}
                  cy={py(series.values[active ?? LAST])}
                  r={active === null ? 3.5 : 5}
                  fill="var(--color-canvas)"
                  stroke={series.color}
                  strokeWidth={2}
                  style={{ transition: "cy 0.22s cubic-bezier(0.22, 1, 0.36, 1), r 0.2s" }}
                />
              ))}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
