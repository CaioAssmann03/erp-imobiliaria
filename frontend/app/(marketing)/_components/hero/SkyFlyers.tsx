"use client";

import { useEffect, useRef } from "react";

import { brandRamp } from "@/lib/theme/brand-ramp";
import { cn } from "@/lib/utils";

import { LINE, PITCH } from "./skyline-layers";

/** Pedaço de uma linha da figura: de `x0` a `x1`, em px de CSS a partir da esquerda da figura. */
type Segment = [number, number];

/** Figura desenhada como o skyline: uma linha de `LINE` px a cada `PITCH` px, só os trechos de cada linha. */
interface Sprite {
  width: number;
  rows: Segment[][];
}

/** Avião de lado, voltado para a direita: cauda à esquerda, asa varrida embaixo do meio. */
const PLANE: Sprite = {
  width: 116,
  rows: [
    [[10, 20]],
    [[8, 26]],
    [[6, 34]],
    [[2, 108]],
    [[0, 116]],
    [[4, 102], [46, 86]],
    [[54, 92], [60, 74]],
    [[68, 94]],
    [[78, 92]],
  ],
};

/** Pássaro batendo asa: asas para cima, retas e para baixo, nessa ordem (e de volta pelas retas). */
const BIRD: Sprite[] = [
  { width: 36, rows: [[[0, 7], [29, 36]], [[6, 14], [22, 30]], [[12, 24]], [[16, 20]]] },
  { width: 36, rows: [[], [[0, 10], [26, 36]], [[8, 28]], [[16, 20]]] },
  { width: 36, rows: [[[14, 22]], [[8, 16], [20, 28]], [[2, 10], [26, 34]], [[0, 4], [32, 36]]] },
];
const BIRD_CYCLE = [0, 1, 2, 1];
const FLAP_MS = 130;

/** Intervalo entre uma passagem e a próxima (ms). */
/** Tempo (ms) que a pessoa precisa já ter passado no hero, com a aba visível e o hero à vista, para o primeiro voo. */
const FIRST_DWELL = [12000, 18000] as const;
const GAP = [6000, 13000] as const;
const MAX_RATIO = 1.5;
const TRAIL = 240;

interface Flyer {
  kind: "plane" | "bird";
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 1 = indo para a direita, -1 = para a esquerda. */
  dir: 1 | -1;
  phase: number;
  scale: number;
  tone: number;
  alpha: number;
}

const between = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

/**
 * Client Component: depois de a pessoa ficar um tempo no hero, e de vez em quando daí em diante, passa pelo céu um avião
 * (com um rastro que some) ou um bando de pássaros em V, no mesmo desenho de linhas laranja do skyline. Só desenha enquanto há alguém no ar, e nada quando a aba está
 * escondida ou o hero já foi coberto pela seção seguinte. Não aparece para quem prefere menos movimento.
 */
export function SkyFlyers({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ramp = brandRamp(canvas);
    const tones = [ramp(0.72), ramp(0.55), ramp(0.3)];
    let width = 0;
    let height = 0;
    let flyers: Flyer[] = [];
    let animation = 0;
    let timer = 0;
    let watch = 0;
    let last = 0;

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      width = Math.floor(box.width);
      height = Math.floor(box.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    /** Altura de uma passagem: sempre numa linha da grade, para as linhas casarem com as do resto da página. */
    const altitude = (from: number, to: number, rows: number) =>
      Math.round((height * between([from, to]) - (rows * PITCH) / 2) / PITCH) * PITCH;

    const spawn = () => {
      timer = 0;
      // Escondida, coberta ou ainda sem tamanho: espera um pouco e tenta de novo.
      if (document.hidden || window.scrollY > window.innerHeight * 0.5 || width < 200) return schedule(2500);
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const from = dir === 1 ? -PLANE.width : width + PLANE.width;
      if (Math.random() < 0.45) {
        flyers.push({
          kind: "plane",
          x: from,
          y: altitude(0.2, 0.55, PLANE.rows.length),
          vx: dir * between([130, 190]),
          vy: -between([1, 7]),
          dir,
          phase: 0,
          scale: 1,
          tone: 2,
          alpha: 0.95,
        });
      } else {
        // Bando em V: o líder na frente e os outros atrás, alternando os lados.
        const count = 3 + Math.floor(Math.random() * 4);
        const baseY = altitude(0.2, 0.6, 4);
        const speed = between([70, 105]);
        for (let i = 0; i < count; i++) {
          const rank = Math.ceil(i / 2);
          flyers.push({
            kind: "bird",
            x: from - dir * rank * 46,
            y: baseY + (i % 2 ? 1 : -1) * rank * PITCH * 2 * (i === 0 ? 0 : 1),
            vx: dir * speed,
            vy: -between([0, 3]),
            dir,
            phase: Math.random() * 1000,
            scale: 0.85 + Math.random() * 0.3,
            tone: Math.random() < 0.5 ? 1 : 2,
            alpha: 0.9,
          });
        }
      }
      if (!animation) {
        last = performance.now();
        animation = requestAnimationFrame(tick);
      }
    };

    const schedule = (delay: number) => {
      timer = window.setTimeout(spawn, delay);
    };

    const drawSprite = (sprite: Sprite, x: number, y: number, dir: 1 | -1, scale: number) => {
      sprite.rows.forEach((segments, row) => {
        for (const [x0, x1] of segments) {
          const left = dir === 1 ? x0 : sprite.width - x1;
          context.fillRect(Math.round(x + left * scale), y + row * PITCH, Math.max(1, Math.round((x1 - x0) * scale)), LINE);
        }
      });
    };

    const tick = (now: number) => {
      const seconds = Math.min((now - last) / 1000, 0.1);
      last = now;
      context.clearRect(0, 0, width, height);

      flyers = flyers.filter((f) => f.x > -PLANE.width - TRAIL && f.x < width + PLANE.width + TRAIL);
      for (const flyer of flyers) {
        flyer.x += flyer.vx * seconds;
        flyer.y += flyer.vy * seconds;
        const y = Math.round(flyer.y / PITCH) * PITCH;
        context.fillStyle = tones[flyer.tone];
        context.globalAlpha = flyer.alpha;
        if (flyer.kind === "plane") {
          // Rastro: uma linha fina saindo da cauda e esmaecendo para trás.
          const tail = flyer.dir === 1 ? flyer.x + 2 : flyer.x + PLANE.width - 2;
          const end = tail - flyer.dir * TRAIL;
          const gradient = context.createLinearGradient(tail, 0, end, 0);
          gradient.addColorStop(0, tones[0]);
          gradient.addColorStop(1, "rgba(255,255,255,0)");
          context.globalAlpha = 0.55;
          context.fillStyle = gradient;
          context.fillRect(Math.min(tail, end), y + 4 * PITCH, TRAIL, LINE);
          context.globalAlpha = flyer.alpha;
          context.fillStyle = tones[flyer.tone];
          drawSprite(PLANE, flyer.x, y, flyer.dir, flyer.scale);
        } else {
          const frame = BIRD[BIRD_CYCLE[Math.floor((now + flyer.phase) / FLAP_MS) % BIRD_CYCLE.length]];
          drawSprite(frame, flyer.x, y, flyer.dir, flyer.scale);
        }
      }
      context.globalAlpha = 1;

      if (flyers.length) {
        animation = requestAnimationFrame(tick);
      } else {
        animation = 0;
        schedule(between(GAP));
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    // O primeiro voo só sai depois de a pessoa ficar um tempo no hero (aba escondida ou hero coberto não contam).
    let dwell = 0;
    const needed = between(FIRST_DWELL);
    watch = window.setInterval(() => {
      if (document.hidden || window.scrollY > window.innerHeight * 0.5) return;
      dwell += 500;
      if (dwell < needed) return;
      window.clearInterval(watch);
      spawn();
    }, 500);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(watch);
      cancelAnimationFrame(animation);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={cn("pointer-events-none block", className)} />;
}
