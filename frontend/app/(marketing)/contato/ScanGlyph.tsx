"use client";

import { useEffect, useRef } from "react";

import { brandRamp } from "@/lib/theme/brand-ramp";
import { isLite } from "@/lib/theme/use-lite";

import { LINE, PITCH } from "@/app/(marketing)/_components/hero/skyline-layers";

/** Densidade máxima de pixels e largura de cada trecho das linhas (px de CSS), como no mapa da home. */
const MAX_RATIO = 1.5;
const CELL = 3;
/** O ícone é um pedaço de uma esfera grande (raio = esta razão × o lado), luz vinda de cima à esquerda: a curvatura dá o relevo, nos seis tons da rampa. */
const SPHERE_RATIO = 1.22;
const LIGHT = [-0.5, 0.55, 0.68] as const;
const RELIEF = 3.4;
/** Espessura: camadas atrás do ícone, cada uma deslocada para baixo e para a direita; o balanço lento mexe no deslocamento lateral. */
const SLAB = 3;
const SLAB_DX = 3;
const SWAY_MS = 9000;
/** Entrada (ms): linhas de baixo para cima, cada uma traçada da esquerda para a direita, e depois a espessura sai de trás. */
const BUILD_MS = 1000;
const ROW_MS = 500;
const SLAB_MS = 500;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/** Um ícone: o contorno (em 24 × 24, `evenodd`) e, opcional, uma forma recortada do meio (com a sua própria transformação). */
export interface Glyph {
  path: string;
  hole?: { path: string; transform: { x: number; y: number; scale: number } };
}

/** Quais células do quadro (`side` × `side`, em px) o ícone cobre: o ícone é desenhado grande num canvas fora da tela e lido célula a célula. */
function coverage(glyph: Glyph, side: number) {
  const scratch = document.createElement("canvas");
  scratch.width = side;
  scratch.height = side;
  const context = scratch.getContext("2d", { willReadFrequently: true })!;
  const size = side * 0.82;
  context.translate(side * 0.03, side * 0.03);
  context.scale(size / 24, size / 24);
  context.fill(new Path2D(glyph.path), "evenodd");
  if (glyph.hole) {
    const { x, y, scale } = glyph.hole.transform;
    context.globalCompositeOperation = "destination-out";
    context.translate(x, y);
    context.scale(scale, scale);
    context.fill(new Path2D(glyph.hole.path));
  }
  const data = context.getImageData(0, 0, side, side).data;
  return (x: number, y: number) => {
    const px = Math.min(side - 1, Math.floor(x));
    const py = Math.min(side - 1, Math.floor(y));
    return data[(py * side + px) * 4 + 3] > 128;
  };
}

/**
 * O ícone no efeito do mapa da home: as mesmas linhas finas laranja (3 px de cor, 1 de vão), seis tons da rampa do tema dados
 * pela luz de uma esfera, uma espessura em camadas atrás e um balanço lento nela. Ao chegar à tela ele se constrói: linha por
 * linha, de baixo para cima, cada uma traçada da esquerda para a direita; depois a espessura sai de trás dele. `delay` (ms)
 * atrasa o começo, para os ícones lado a lado não entrarem juntos. Parado e já pronto no modo leve.
 */
export function ScanGlyph({ glyph, delay = 0, className }: { glyph: Glyph; delay?: number; className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!wrapper || !canvas || !context) return;

    const still = isLite();
    const ramp = brandRamp(canvas);
    const tones = [ramp(0.76), ramp(0.65), ramp(0.54), ramp(0.42), ramp(0.3), ramp(0.16)];
    const slabColor = ramp(0.1);

    let side = 0;
    let ratio = 1;
    let inside: (x: number, y: number) => boolean = () => false;
    /** O tom (0 = claro, 5 = sombra) de cada célula de cada linha, -1 fora do ícone e -2 num furo (vazio cercado pelo ícone). */
    let rows: Int8Array[] = [];
    let startedAt = -1;
    let visible = false;
    let frame = 0;

    const measure = () => {
      side = Math.floor(wrapper.getBoundingClientRect().width);
      if (!side) return;
      ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      canvas.width = Math.round(side * ratio);
      canvas.height = Math.round(side * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      inside = coverage(glyph, side);

      const sphere = Math.round(side * SPHERE_RATIO);
      const norm = Math.hypot(...LIGHT);
      const centerLight = LIGHT[2] / norm;
      const lines = Math.floor(side / PITCH);
      const columns = Math.ceil(side / CELL);
      // Furos: o vazio que não se liga à borda do quadro (os campos do formulário, o fone do balão), achados por um preenchimento a partir da borda.
      const covered = Array.from({ length: lines }, (_, line) => Uint8Array.from({ length: columns }, (_, column) => (inside(column * CELL + CELL / 2, line * PITCH + LINE / 2) ? 1 : 0)));
      const outside = Array.from({ length: lines }, () => new Uint8Array(columns));
      const pending: [number, number][] = [];
      const reach = (line: number, column: number) => {
        if (line < 0 || column < 0 || line >= lines || column >= columns || covered[line][column] || outside[line][column]) return;
        outside[line][column] = 1;
        pending.push([line, column]);
      };
      for (let line = 0; line < lines; line++) {
        reach(line, 0);
        reach(line, columns - 1);
      }
      for (let column = 0; column < columns; column++) {
        reach(0, column);
        reach(lines - 1, column);
      }
      while (pending.length) {
        const [line, column] = pending.pop()!;
        reach(line - 1, column);
        reach(line + 1, column);
        reach(line, column - 1);
        reach(line, column + 1);
      }
      rows = Array.from({ length: lines }, (_, line) => {
        const row = new Int8Array(columns);
        const ny = -(line * PITCH + LINE / 2 - side / 2) / sphere;
        for (let column = 0; column < columns; column++) {
          const x = column * CELL;
          if (!covered[line][column]) {
            row[column] = outside[line][column] ? -1 : -2;
            continue;
          }
          const nx = (x + CELL / 2 - side / 2) / sphere;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          const light = 0.1 + ((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / norm - centerLight) * RELIEF;
          row[column] = light > 0.6 ? 0 : light > 0.32 ? 1 : light > 0.08 ? 2 : light > -0.15 ? 3 : light > -0.4 ? 4 : 5;
        }
        return row;
      });
    };

    const draw = (now: number) => {
      if (!side) return;
      const elapsed = still ? Number.MAX_SAFE_INTEGER : now - startedAt;
      const lines = rows.length;
      // Um caminho por tom (e um para a silhueta e outro para os furos): células vizinhas do mesmo tipo viram um retângulo só,
      // cortado na borda da linha em construção.
      const paths = tones.map(() => new Path2D());
      const silhouette = new Path2D();
      const holes = new Path2D();
      const kindOf = (value: number) => (value >= 0 ? value : value === -2 ? 6 : -1);
      for (let line = 0; line < lines; line++) {
        const startAt = (1 - line / Math.max(1, lines - 1)) * BUILD_MS;
        const edge = easeOut((elapsed - startAt) / ROW_MS) * side;
        if (edge <= 0) continue;
        const row = rows[line];
        let runStart = 0;
        let runKind = -1;
        for (let column = 0; column <= row.length; column++) {
          const kind = column < row.length ? kindOf(row[column]) : -1;
          const x = column * CELL;
          if (kind !== runKind || x >= edge) {
            if (runKind >= 0) {
              const run: [number, number, number, number] = [runStart, line * PITCH, Math.min(x, edge) - runStart, LINE];
              if (runKind === 6) holes.rect(...run);
              else paths[runKind].rect(...run);
              silhouette.rect(...run);
            }
            runStart = x;
            runKind = x >= edge ? -1 : kind;
            if (x >= edge) break;
          }
        }
      }

      context.clearRect(0, 0, side, side);
      const slabProgress = easeOut((elapsed - BUILD_MS - ROW_MS) / SLAB_MS);
      if (slabProgress > 0) {
        const sway = still ? 0 : 0.8 * Math.sin((elapsed / SWAY_MS) * Math.PI * 2) * slabProgress;
        context.fillStyle = slabColor;
        context.globalAlpha = 0.85;
        for (let layer = SLAB; layer >= 1; layer--) {
          context.save();
          context.translate(layer * SLAB_DX * (1 + sway) * slabProgress, layer * PITCH * slabProgress);
          context.fill(silhouette);
          context.restore();
        }
        context.globalAlpha = 1;
        // Os furos ficam vazados: a espessura não os tampa.
        context.globalCompositeOperation = "destination-out";
        context.fill(holes);
        context.globalCompositeOperation = "source-over";
      }
      tones.forEach((color, index) => {
        context.fillStyle = color;
        context.fill(paths[index]);
      });
    };

    const loop = (now: number) => {
      draw(now);
      frame = visible && !still ? requestAnimationFrame(loop) : 0;
    };

    measure();
    const resize = new ResizeObserver(() => {
      measure();
      draw(performance.now());
    });
    resize.observe(wrapper);

    if (still) draw(0);
    const watch = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && startedAt < 0) startedAt = performance.now() + delay;
        if (visible && !frame && !still) frame = requestAnimationFrame(loop);
      },
      { threshold: 0.3 },
    );
    watch.observe(wrapper);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      watch.disconnect();
    };
  }, [glyph, delay]);

  return (
    <div ref={wrapperRef} className={className}>
      <canvas ref={canvasRef} aria-hidden className="size-full" />
    </div>
  );
}
