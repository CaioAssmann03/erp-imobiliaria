"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { brandRamp } from "@/lib/theme/brand-ramp";
import { subscribeMode } from "@/lib/theme/mode";

import { LINE, PITCH } from "../hero/skyline-layers";
import { MASK, MASK_BASE64 } from "./brazil-mask";
import { LocationCard } from "./LocationCard";
import { LOCATIONS } from "./locations";
import { PHOTOS } from "./photos";

/** Densidade máxima de pixels, como no skyline. */
const MAX_RATIO = 1.5;
/** Largura de cada trecho das linhas (px de CSS): menor que isso não muda o desenho e custa mais por quadro. */
const CELL = 3;
/** O mapa é um pedaço de uma esfera grande (raio = esta razão × o lado da área): o Brasil enche a área e a curvatura dá o relevo. */
const SPHERE_RATIO = 1.22;
/** Longitude e latitude do centro da vista: o meio da caixa do país, para o mapa ficar centrado e caber com o zoom. */
const CENTER_LON = -54;
const CENTER_LAT = -14.2;
/** Balanço lento do mapa em torno do eixo vertical (graus e período em ms): o relevo e as bordas mudam um pouco, como um objeto 3D. */
const SWAY = 3;
const SWAY_MS = 24000;
/** Luz vinda de cima à esquerda, em coordenadas da tela (x direita, y cima, z para quem olha). */
const LIGHT = [-0.5, 0.55, 0.68] as const;
/** Quanto o relevo exagera as diferenças de luz entre uma ponta e outra do país. */
const RELIEF = 3.4;
/** Camadas de "espessura" atrás do mapa, cada uma deslocada para baixo e para a direita: o mapa parece uma placa. */
const SLAB = 4;
const SLAB_DX = 3;
const SLAB_DY = PITCH;

/**
 * Entrada (ms desde que o palco aparece): o mapa se constrói no lugar, linha por linha, de baixo para cima, e cada
 * linha é traçada da esquerda para a direita; depois a espessura sai de trás dele e o balanço começa.
 */
const BUILD_MS = 1400;
const ROW_MS = 600;
const SLAB_MS = 600;
/** Daqui em diante o desenho do mapa só muda com o balanço, então passa a vir de uma camada em cache. */
const SETTLED_MS = BUILD_MS + ROW_MS + SLAB_MS;
/** Depois disso os dois pontos dos cartões começam a se revezar (o segundo, um pouco depois do primeiro). */
const CYCLE_START = BUILD_MS + ROW_MS - 200;
const CYCLE_STAGGER = 1400;
/** Cada ponto: surge, o cartão aparece e a linha o liga ao ponto; fica um tempo; então tudo some e outro ponto entra. Nunca mais de dois ao mesmo tempo. */
const POINT_IN_MS = 450;
const LINK_MS = 700;
const HOLD_MS = 5500;
const OUT_MS = 300;
const GAP_MS = [700, 1500] as const;
const PULSE_MS = 1400;

const RAD = Math.PI / 180;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeOutBack = (t: number) => {
  const x = clamp01(t) - 1;
  return 1 + 2.4 * x * x * x + 1.4 * x * x;
};

function decodeMask() {
  const bytes = Uint8Array.from(atob(MASK_BASE64), (char) => char.charCodeAt(0));
  const mask = new Uint8Array(MASK.columns * MASK.rows);
  for (let index = 0; index < mask.length; index++) mask[index] = (bytes[index >> 3] >> (index & 7)) & 1;
  return mask;
}

/** Células das linhas do mapa, em coordenadas a partir do centro, calculadas uma vez por tamanho: só a rotação muda. */
interface Grid {
  half: number;
  sphere: number;
  /** Onde cada linha de varredura começa e termina no vetor de células, e a posição vertical dela. */
  rowStart: Int32Array;
  rowY: Float32Array;
  x: Float32Array;
  /** Linha da máscara (latitude) de cada célula, ou -1 fora da caixa. */
  row: Int16Array;
  /** Longitude em relação ao centro (graus) e tom de luz (0 = claro, 5 = sombra). */
  lonRel: Float32Array;
  tone: Uint8Array;
}

function buildGrid(half: number, sphere: number): Grid {
  const lines = Math.max(0, Math.floor((half * 2) / PITCH));
  const cells: { x: number; row: number; lonRel: number; tone: number }[] = [];
  const rowStart = new Int32Array(lines + 1);
  const rowY = new Float32Array(lines);
  const tilt = CENTER_LAT * RAD; // o centro da vista aponta para essa latitude
  const sinTilt = Math.sin(tilt);
  const cosTilt = Math.cos(tilt);
  const norm = Math.hypot(...LIGHT);
  const centerLight = LIGHT[2] / norm;

  for (let line = 0; line < lines; line++) {
    rowStart[line] = cells.length;
    rowY[line] = -half + line * PITCH;
    const ny = -(rowY[line] + LINE / 2) / sphere;
    for (let x = -half; x < half; x += CELL) {
      const nx = (x + CELL / 2) / sphere;
      const flat = nx * nx + ny * ny;
      if (flat > 1) continue;
      const nz = Math.sqrt(1 - flat);
      // Da tela para o referencial do globo (desfaz a inclinação) e daí para latitude e longitude.
      const gy = ny * cosTilt + nz * sinTilt;
      const gz = -ny * sinTilt + nz * cosTilt;
      const lat = Math.asin(Math.max(-1, Math.min(1, gy))) / RAD;
      const row = Math.floor((MASK.lat0 - lat) / MASK.step);
      // A luz é medida a partir do centro e esticada: em um país tão pequeno na esfera a diferença real é leve.
      const light = 0.1 + ((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / norm - centerLight) * RELIEF;
      cells.push({
        x,
        row: row >= 0 && row < MASK.rows ? row : -1,
        lonRel: Math.atan2(nx, gz) / RAD,
        tone: light > 0.6 ? 0 : light > 0.32 ? 1 : light > 0.08 ? 2 : light > -0.15 ? 3 : light > -0.4 ? 4 : 5,
      });
    }
  }
  rowStart[lines] = cells.length;
  return {
    half,
    sphere,
    rowStart,
    rowY,
    x: Float32Array.from(cells, (cell) => cell.x),
    row: Int16Array.from(cells, (cell) => cell.row),
    lonRel: Float32Array.from(cells, (cell) => cell.lonRel),
    tone: Uint8Array.from(cells, (cell) => cell.tone),
  };
}

interface Point {
  x: number;
  y: number;
}

interface Placed extends Point {
  /** Profundidade: 1 no centro da vista, 0 na borda, negativa do outro lado. */
  z: number;
}

/** Um dos dois ciclos de ponto + cartão: qual ponto, quando surgiu, se o cartão já entrou, quando começou a sair e quando o próximo pode entrar. */
interface Cycle {
  index: number | null;
  pickedAt: number;
  shown: boolean;
  endedAt: number;
  nextAt: number;
}

/**
 * Client Component: o mapa do Brasil da seção, em 3D. As linhas horizontais laranja são as mesmas dos prédios do hero:
 * o país (máscara de 0,1° em `brazil-mask.ts`) é um pedaço de uma esfera grande, então a curvatura dá relevo à luz
 * (seis tons da rampa do tema), uma sombra em camadas o faz parecer uma placa, e um balanço lento mostra as bordas
 * mudando. Ele se constrói ao aparecer: linha por linha, de baixo para cima, cada uma traçada da esquerda para a
 * direita. Depois, no máximo dois condomínios (`locations.ts`) ficam à vista por vez, um em cada lado: o ponto surge,
 * um cartão com a foto (ilustrativa, `LocationCard`) entra ligado a ele por uma linha, fica um tempo e tudo some,
 * dando lugar a outro. A entrada começa quando o palco chega à tela. Parado (com dois pontos fixos) para quem
 * prefere menos movimento.
 */
export function GlobeStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const [active, setActive] = useState<(number | null)[]>([null, null]);

  useEffect(() => {
    const stage = stageRef.current;
    const area = areaRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!stage || !area || !canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ramp = brandRamp(canvas);
    const tones = [ramp(0.76), ramp(0.65), ramp(0.54), ramp(0.42), ramp(0.3), ramp(0.16)];
    const slabColor = ramp(0.1);
    // Cores dos pontos: os tokens de tinta e de superfície do tema; lidos de novo quando o modo muda.
    let ink = "";
    let surface = "";
    const readColors = () => {
      const current = getComputedStyle(canvas);
      ink = current.getPropertyValue("--color-ink").trim();
      surface = current.getPropertyValue("--color-surface").trim();
    };
    readColors();

    const mask = decodeMask();
    const tilt = CENTER_LAT * RAD;
    const sinTilt = Math.sin(tilt);
    const cosTilt = Math.cos(tilt);

    let grid = buildGrid(0, 1);
    let ratio = 1;
    // Camada do mapa pronto (ver `blitMap`); `mapKey` é o passo de rotação nela desenhado, NaN = precisa redesenhar.
    const mapLayer = document.createElement("canvas");
    const mapContext = mapLayer.getContext("2d")!;
    let mapKey = Number.NaN;
    let width = 0;
    let height = 0;
    let center: Point = { x: 0, y: 0 };
    let anchors: (Point | null)[] = [null, null];
    let startedAt = -1;
    let visible = false;
    let animation = 0;
    const cycles: Cycle[] = [0, 1].map(() => ({ index: null, pickedAt: 0, shown: false, endedAt: -1, nextAt: 0 }));
    const shownIndex: (number | null)[] = [null, null];
    // Fila embaralhada das cidades: cada vez sai a próxima que cabe no lado do cartão, e ela vai para o fim.
    const queue = LOCATIONS.map((_, index) => index).sort(() => Math.random() - 0.5);

    /** Mede o palco: tamanho da tela, centro e tamanho do mapa (a área vazia reservada no layout) e onde cada linha encosta no seu cartão. */
    const measure = () => {
      const stageBox = stage.getBoundingClientRect();
      const areaBox = area.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      width = Math.floor(stageBox.width);
      height = Math.floor(stageBox.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      center = {
        x: Math.round(areaBox.left - stageBox.left + areaBox.width / 2),
        y: Math.round(areaBox.top - stageBox.top + areaBox.height / 2),
      };
      const side = Math.floor(Math.min(areaBox.width, areaBox.height));
      const half = Math.floor(side / 2);
      const sphere = Math.round(side * SPHERE_RATIO);
      if (half !== grid.half || sphere !== grid.sphere) grid = buildGrid(half, sphere);
      // A camada do mapa cobre o quadrado do país mais a espessura (que sai para a direita e para baixo).
      mapLayer.width = Math.ceil((half * 2 + SLAB * SLAB_DX + 2) * ratio);
      mapLayer.height = Math.ceil((half * 2 + SLAB * SLAB_DY + 2) * ratio);
      mapKey = Number.NaN;
      anchors = slotRefs.current.map((slot) => {
        if (!slot) return null;
        const box = slot.getBoundingClientRect();
        if (!box.width || !box.height) return null;
        const left = box.left - stageBox.left;
        const top = box.top - stageBox.top;
        // Cartão abaixo do mapa (telas estreitas): a linha sai do meio do topo; ao lado: da borda que olha para o mapa.
        if (box.top >= areaBox.bottom - 4) return { x: left + box.width / 2, y: top };
        return left + box.width / 2 < center.x ? { x: left + box.width, y: top + box.height / 2 } : { x: left, y: top + box.height / 2 };
      });
    };

    const place = (index: number, rotation: number, sphere: number): Placed => {
      const location = LOCATIONS[index];
      const lat = location.lat * RAD;
      const lon = (location.lon - rotation) * RAD;
      const gx = Math.cos(lat) * Math.sin(lon);
      const gy = Math.sin(lat);
      const gz = Math.cos(lat) * Math.cos(lon);
      return { x: gx * sphere, y: -(gy * cosTilt - gz * sinTilt) * sphere, z: gy * sinTilt + gz * cosTilt };
    };

    /** Próxima cidade da fila que está do lado do cartão, bem dentro do mapa e não está em uso pelo outro cartão. */
    const pickNext = (placed: Placed[], slot: number) => {
      const side = slot === 0 ? -1 : 1;
      const margin = grid.half - 14;
      for (let k = 0; k < queue.length; k++) {
        const index = queue[k];
        const point = placed[index];
        if (cycles.some((cycle) => cycle.index === index) || point.z < 0.3) continue;
        if (side * point.x > 10 && Math.abs(point.x) < margin && Math.abs(point.y) < margin) {
          queue.splice(k, 1);
          queue.push(index);
          return index;
        }
      }
      return null;
    };

    const showCard = (slot: number, index: number | null) => {
      shownIndex[slot] = index;
      setActive([...shownIndex]);
    };

    /** Avança os dois ciclos: escolhe o ponto, mostra o cartão depois que ele surge, manda tudo sumir após o tempo e espera um intervalo. */
    const advance = (placed: Placed[], now: number) => {
      cycles.forEach((cycle, slot) => {
        if (!anchors[slot]) return;
        if (cycle.index === null) {
          if (now < cycle.nextAt) return;
          const index = pickNext(placed, slot);
          if (index === null) return;
          Object.assign(cycle, { index, pickedAt: now, shown: false, endedAt: -1 });
          return;
        }
        const age = now - cycle.pickedAt;
        if (!cycle.shown && age >= POINT_IN_MS) {
          cycle.shown = true;
          showCard(slot, cycle.index);
        }
        if (cycle.endedAt < 0 && age >= POINT_IN_MS + HOLD_MS) {
          cycle.endedAt = now;
          showCard(slot, null);
        }
        if (cycle.endedAt >= 0 && now - cycle.endedAt >= OUT_MS) {
          cycle.index = null;
          cycle.nextAt = now + GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]);
        }
      });
    };

    /** Desenha o mapa (tons e espessura) em `target`, com a origem no centro dele. */
    const paintMap = (target: CanvasRenderingContext2D, elapsed: number, rotation: number) => {
      const { half, rowStart, rowY, x, row, lonRel, tone } = grid;
      // Um caminho por tom de luz: runs de células vizinhas do mesmo tom viram um retângulo só (cortado na borda da linha em construção).
      const paths = tones.map(() => new Path2D());
      const addRun = (kind: number, start: number, end: number, y: number, edge: number) => {
        const stop = Math.min(end, edge);
        if (kind >= 0 && stop > start) paths[kind].rect(start, y, stop - start, LINE);
      };
      const lines = rowY.length;
      for (let line = 0; line < lines; line++) {
        // Construção: as linhas de baixo começam primeiro e cada uma é traçada da esquerda para a direita.
        const startAt = (1 - line / Math.max(1, lines - 1)) * BUILD_MS;
        const edge = -half + easeOut((elapsed - startAt) / ROW_MS) * half * 2;
        if (edge <= -half) continue;
        let runStart = 0;
        let runKind = -1;
        let runEnd = 0;
        for (let cell = rowStart[line]; cell < rowStart[line + 1]; cell++) {
          if (x[cell] >= edge) break;
          let kind = -1;
          if (row[cell] >= 0) {
            const column = Math.floor((lonRel[cell] + rotation - MASK.lon0) / MASK.step);
            if (column >= 0 && column < MASK.columns && mask[row[cell] * MASK.columns + column]) kind = tone[cell];
          }
          if (kind !== runKind) {
            addRun(runKind, runStart, runEnd, rowY[line], edge);
            runStart = x[cell];
            runKind = kind;
          }
          runEnd = x[cell] + CELL;
        }
        addRun(runKind, runStart, runEnd, rowY[line], edge);
      }
      // Espessura: o mesmo desenho deslocado para baixo e para a direita, em camadas, que saem de trás do mapa depois de construído.
      const slabProgress = easeOut((elapsed - BUILD_MS - ROW_MS) / SLAB_MS);
      if (slabProgress > 0) {
        const slab = new Path2D();
        paths.forEach((path) => slab.addPath(path));
        target.fillStyle = slabColor;
        target.globalAlpha = 0.85;
        for (let layer = SLAB; layer >= 1; layer--) {
          target.save();
          target.translate(layer * SLAB_DX * slabProgress, layer * SLAB_DY * slabProgress);
          target.fill(slab);
          target.restore();
        }
        target.globalAlpha = 1;
      }
      tones.forEach((color, index) => {
        target.fillStyle = color;
        target.fill(paths[index]);
      });
    };

    /**
     * O mapa pronto, numa camada fora da tela: o balanço só muda o desenho a cada passo da máscara (0,1°), então ele é
     * redesenhado só quando a rotação cruza um passo (poucas vezes por segundo) e os demais quadros apenas colam a camada.
     */
    const blitMap = (rotation: number) => {
      if (!mapLayer.width || !mapLayer.height) return;
      const key = Math.round(rotation / MASK.step);
      if (key !== mapKey) {
        mapKey = key;
        mapContext.setTransform(1, 0, 0, 1, 0, 0);
        mapContext.clearRect(0, 0, mapLayer.width, mapLayer.height);
        mapContext.setTransform(ratio, 0, 0, ratio, grid.half * ratio, grid.half * ratio);
        paintMap(mapContext, Number.MAX_SAFE_INTEGER, key * MASK.step);
      }
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0); // em pixels do dispositivo: a colagem sai nítida, sem reamostrar
      context.drawImage(mapLayer, Math.round((center.x - grid.half) * ratio), Math.round((center.y - grid.half) * ratio));
      context.restore();
    };

    const draw = (now: number) => {
      if (startedAt < 0 || !width) return;
      const elapsed = now - startedAt;
      const { sphere } = grid;
      // O balanço só começa depois que o mapa está construído.
      const sway = reduceMotion ? 0 : SWAY * Math.sin((elapsed / SWAY_MS) * Math.PI * 2) * easeOut((elapsed - BUILD_MS) / 1800);
      const rotation = CENTER_LON + sway;
      context.clearRect(0, 0, width, height);

      context.save();
      context.translate(center.x, center.y);
      // Construindo, o desenho muda a cada quadro; depois disso vale a camada em cache.
      if (elapsed >= SETTLED_MS) blitMap(rotation);
      else paintMap(context, elapsed, rotation);

      // Os pontos dos cartões (no máximo dois): surgem, pulsam e somem quando o cartão sai.
      const placed = LOCATIONS.map((_, index) => place(index, rotation, sphere));
      if (!reduceMotion && elapsed > CYCLE_START - 100) advance(placed, now);
      cycles.forEach((cycle) => {
        if (cycle.index === null) return;
        const point = placed[cycle.index];
        const age = now - cycle.pickedAt;
        const level = cycle.endedAt >= 0 ? 1 - clamp01((now - cycle.endedAt) / OUT_MS) : clamp01(age / POINT_IN_MS);
        if (level <= 0) return;
        const px = Math.round(point.x);
        const py = Math.round(point.y);
        const pulse = reduceMotion ? 0.3 : (age / PULSE_MS) % 1;
        const ring = 12 + pulse * 30;
        context.globalAlpha = level * (1 - pulse) * 0.7;
        context.strokeStyle = ink;
        context.lineWidth = 1.5;
        context.strokeRect(Math.round(px - ring / 2), Math.round(py - ring / 2), ring, ring);
        const inner = Math.max(0, Math.round(8 * (cycle.endedAt >= 0 ? level : easeOutBack(level))));
        const outer = inner + 4;
        context.globalAlpha = Math.min(1, level * 1.4);
        context.fillStyle = surface;
        context.fillRect(px - outer / 2, py - outer / 2, outer, outer);
        context.fillStyle = ink;
        context.fillRect(px - inner / 2, py - inner / 2, inner, inner);
      });
      context.restore();

      // Linhas dos cartões até os pontos: desenham-se a partir do cartão quando ele entra e se recolhem quando sai.
      context.lineWidth = 1;
      context.strokeStyle = ink;
      context.fillStyle = ink;
      cycles.forEach((cycle, slot) => {
        const anchor = anchors[slot];
        if (cycle.index === null || !anchor || now - cycle.pickedAt < POINT_IN_MS) return;
        const point = placed[cycle.index];
        const progress =
          cycle.endedAt >= 0 ? 1 - easeOut((now - cycle.endedAt) / OUT_MS) : easeOut((now - cycle.pickedAt - POINT_IN_MS) / LINK_MS);
        const target = { x: center.x + point.x, y: center.y + point.y };
        context.globalAlpha = 0.6;
        context.beginPath();
        context.moveTo(Math.round(anchor.x) + 0.5, Math.round(anchor.y) + 0.5);
        context.lineTo(Math.round(anchor.x + (target.x - anchor.x) * progress) + 0.5, Math.round(anchor.y + (target.y - anchor.y) * progress) + 0.5);
        context.stroke();
        context.fillRect(Math.round(anchor.x) - 2, Math.round(anchor.y) - 2, 4, 4);
      });
      context.globalAlpha = 1;
    };

    const tick = (now: number) => {
      animation = requestAnimationFrame(tick);
      if (visible) draw(now);
    };

    const resizeObserver = new ResizeObserver(() => {
      measure();
      draw(performance.now());
    });
    const reveal = () => {
      if (startedAt >= 0) return;
      startedAt = reduceMotion ? performance.now() - 60000 : performance.now();
      // As fotos começam a baixar já, para estarem prontas quando os cartões entrarem.
      PHOTOS.forEach((photo) => (new window.Image().src = photo.src));
      measure();
      cycles[0].nextAt = startedAt + CYCLE_START;
      cycles[1].nextAt = startedAt + CYCLE_START + CYCLE_STAGGER;
      if (reduceMotion) {
        // Sem movimento: dois pontos fixos, cada um com o seu cartão.
        const placed = LOCATIONS.map((_, index) => place(index, CENTER_LON, grid.sphere));
        [0, 1].forEach((slot) => {
          const index = pickNext(placed, slot);
          if (index === null) return;
          Object.assign(cycles[slot], { index, pickedAt: startedAt - 60000, shown: true, endedAt: -1 });
          shownIndex[slot] = index;
        });
        setActive([...shownIndex]);
      }
      draw(performance.now());
      if (!reduceMotion) animation = requestAnimationFrame(tick);
    };
    // A entrada só começa quando o palco chega à tela; fora dela o loop continua mas não desenha.
    const visibility = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (visible) reveal();
        }
      },
      { threshold: 0.3 },
    );

    // Começa depois que a página assenta, para não disputar o primeiro quadro.
    const start = () => {
      measure();
      resizeObserver.observe(stage);
      visibility.observe(stage);
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 400 }) ?? window.setTimeout(start, 150);
    const unsubscribeMode = subscribeMode(() => {
      readColors();
      draw(performance.now());
    });

    return () => {
      unsubscribeMode();
      window.cancelIdleCallback?.(idle);
      window.clearTimeout(idle);
      resizeObserver.disconnect();
      visibility.disconnect();
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <div ref={stageRef} className="relative grid gap-8 lg:grid-cols-[minmax(0,35rem)_minmax(0,1fr)] lg:gap-x-6">
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
      {/* Texto da seção (título e descrição): canto superior esquerdo. */}
      <div className="relative z-10 lg:col-start-1 lg:row-start-1 lg:self-start">{children}</div>
      {/* Área reservada ao mapa: o canvas desenha o Brasil nela, ampliado. */}
      <div
        ref={areaRef}
        role="img"
        aria-label="Mapa do Brasil em 3D com condomínios marcados em várias cidades"
        className="mx-auto aspect-square w-full max-w-[40rem] lg:col-start-2 lg:row-start-1 lg:mx-0"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:contents">
        {/* Cartão da esquerda: no canto inferior esquerdo do mapa, sobre o oceano do lado do Pacífico. */}
        <div
          ref={(element) => void (slotRefs.current[0] = element)}
          className="mx-auto h-[15.5rem] w-60 lg:z-10 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:self-end lg:justify-self-start"
        >
          <AnimatePresence mode="wait">
            {active[0] !== null && <LocationCard key={active[0]} location={LOCATIONS[active[0]]} />}
          </AnimatePresence>
        </div>
        {/* Cartão da direita: no canto superior direito do mapa, sobre o oceano. */}
        <div
          ref={(element) => void (slotRefs.current[1] = element)}
          className="mx-auto hidden h-[15.5rem] w-60 sm:block lg:z-10 lg:col-start-2 lg:row-start-1 lg:mx-0 lg:self-start lg:justify-self-end"
        >
          <AnimatePresence mode="wait">
            {active[1] !== null && <LocationCard key={active[1]} location={LOCATIONS[active[1]]} />}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
