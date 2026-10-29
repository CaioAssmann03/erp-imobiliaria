import { random } from "@/app/(marketing)/_components/hero/skyline-scene";

/**
 * Desenha o prédio num canvas 2D em tons de cinza: o canvas só serve de molde, o tom vira a cor da partícula
 * (`particles.ts`: 0 = laranja queimado, 0,5 = laranja, 1 = laranja claro). Projeção isométrica: cada volume mostra duas
 * fachadas (a da esquerda iluminada, a da direita na sombra) e o telhado. As fachadas são desenhadas num espaço
 * próprio (u para o lado, v para cima), então janelas e pilares saem inclinados sem conta à mão.
 *
 * Um conjunto só, de volumes diferentes: um pódio baixo envidraçado, uma laje residencial (lajes brancas de varanda e
 * guarda-corpo de vidro) e, na ponta, uma torre mais alta de topo recuado, com canteiros e casa de máquinas nas coberturas.
 */

export const SCENE = { width: 400, height: 376 } as const;

const ORIGIN = { x: 201, y: 266 }; // centro da base do pódio
const COS = Math.sqrt(3) / 2;
const SIN = 0.5;

/** Matriz 2D [a, b, c, d, e, f] do canvas: leva (u, v) da fachada para a tela. */
export type Matrix = [number, number, number, number, number, number];

export interface SceneWindow {
  m: Matrix;
  /** Retângulo da janela no espaço da fachada. */
  u: number;
  v: number;
  w: number;
  h: number;
  /** Brilho da janela acesa. */
  tone: number;
  /** Brilho do vidro apagado (reflexo do céu: cresce com a altura). */
  off: number;
}

interface Face {
  m: Matrix;
  width: number;
  /** Altura da fachada no ponto mais alto. */
  height: number;
  /** Altura do topo da fachada em cada `u` (a do telhado inclinado varia). */
  top: (u: number) => number;
  /** Fator do brilho das janelas desta fachada (a da sombra é mais fraca). */
  glow: number;
}

/** Um tipo de fachada: janelas de `w`×`h` numa grade de `pitchU`×`pitchV` (1 andar = `pitchV`), com laje de varanda opcional. */
interface Facade {
  w: number;
  h: number;
  pitchU: number;
  pitchV: number;
  /** Tom (0..1) da laje de varanda, uma faixa clara sob cada andar; ausente = sem laje. */
  slab?: number;
  /** Espessura da laje (padrão: 60% do vão entre andares). */
  slabH?: number;
  /** Tom (0..1) do guarda-corpo de vidro, uma linha fina na base de cada janela; ausente = sem guarda-corpo. */
  rail?: number;
}

interface Tower {
  gx: number;
  gz: number;
  /** Metade do lado da base (a fachada da esquerda). */
  a: number;
  /** Profundidade da planta em relação a `a` (a fachada da direita): 1 = quadrada, menos = bloco retangular. */
  depth?: number;
  /** Altura do chão ao início do corpo, e do corpo. */
  y0: number;
  height: number;
  /** Quanto o telhado desce do lado esquerdo para o direito (0 = telhado reto). */
  slope?: number;
  left: number;
  right: number;
  top: number;
  /** Fachada: o desenho das janelas. Ausente = parede lisa. */
  panes?: Facade;
  /** Platibanda no topo (os corpos têm; canteiros e casa de máquinas não). */
  parapet?: boolean;
  /** Brilho das janelas acesas (os prédios do fundo, mais fracos). */
  tone?: number;
}

/** Altura de referência: o reflexo do vidro e o brilho do muro crescem até aqui. */
const FULL_HEIGHT = 260;

let next = random(5);

const gray = (level: number) => {
  const v = Math.round(Math.min(Math.max(level, 0), 1) * 255);
  return `rgb(${v},${v},${v})`;
};

const project = (gx: number, gz: number, gy: number): [number, number] => [
  ORIGIN.x + (gx - gz) * COS,
  ORIGIN.y + (gx + gz) * SIN - gy,
];

function faces(t: Tower): { left: Face; right: Face } {
  const slope = t.slope ?? 0;
  const b = t.a * (t.depth ?? 1);
  const [lx, ly] = project(t.gx - t.a, t.gz + b, t.y0);
  const [rx, ry] = project(t.gx + t.a, t.gz + b, t.y0);
  const width = 2 * t.a;
  return {
    left: {
      m: [COS, SIN, 0, -1, lx, ly],
      width,
      height: t.height,
      top: (u) => t.height - (slope * u) / width,
      glow: 1,
    },
    right: {
      m: [COS, -SIN, 0, -1, rx, ry],
      width: 2 * b,
      height: t.height - slope,
      top: () => t.height - slope,
      glow: 0.72,
    },
  };
}

/** Polígono no espaço da fachada, com cor chapada ou degradê vertical `[embaixo, em cima]`. */
function polygon(ctx: CanvasRenderingContext2D, face: Face, level: number | [number, number], points: [number, number][]) {
  ctx.setTransform(...face.m);
  if (typeof level === "number") {
    ctx.fillStyle = gray(level);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, face.height);
    gradient.addColorStop(0, gray(level[0]));
    gradient.addColorStop(1, gray(level[1]));
    ctx.fillStyle = gradient;
  }
  ctx.beginPath();
  points.forEach(([u, v], i) => (i === 0 ? ctx.moveTo(u, v) : ctx.lineTo(u, v)));
  ctx.closePath();
  ctx.fill();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const rect = (ctx: CanvasRenderingContext2D, face: Face, level: number | [number, number], u: number, v: number, w: number, h: number) =>
  polygon(ctx, face, level, [[u, v], [u + w, v], [u + w, v + h], [u, v + h]]);

function roof(ctx: CanvasRenderingContext2D, t: Tower) {
  const top = t.y0 + t.height;
  const slope = t.slope ?? 0;
  const b = t.a * (t.depth ?? 1);
  ctx.fillStyle = gray(t.top);
  ctx.beginPath();
  const corners: [number, number, number][] = [
    [t.gx - t.a, t.gz - b, top],
    [t.gx + t.a, t.gz - b, top - slope],
    [t.gx + t.a, t.gz + b, top - slope],
    [t.gx - t.a, t.gz + b, top],
  ];
  corners.forEach(([gx, gz, gy], i) => {
    const [x, y] = project(gx, gz, gy);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function windows(ctx: CanvasRenderingContext2D, out: SceneWindow[], face: Face, t: Tower) {
  const panes = t.panes;
  if (!panes) return;
  // Margens que fecham a grade: as de cima e de baixo somam o vão entre andares, então a grade segue contínua de um recuo ao outro.
  const marginU = 6;
  const gapV = panes.pitchV - panes.h;
  const marginV = gapV / 2;
  const gap = panes.pitchU - panes.w;
  const columns = Math.floor((face.width - 2 * marginU + gap) / panes.pitchU);
  const u0 = (face.width - (columns * panes.pitchU - gap)) / 2;
  let v = marginV;
  for (; v + panes.h + marginV <= face.height; v += panes.pitchV) {
    // Laje de varanda: uma faixa clara de ponta a ponta sob o andar (só onde o telhado inclinado ainda a comporta).
    if (panes.slab !== undefined && v >= gapV && v + panes.h + marginV <= face.top(face.width)) {
      rect(ctx, face, face.glow === 1 ? panes.slab : panes.slab * 0.45, -1, v - gapV, face.width + 3, panes.slabH ?? Math.round(gapV * 0.6));
    }
    for (let column = 0; column < columns; column++) {
      const u = u0 + column * panes.pitchU;
      // Telhado inclinado: não põe janela onde a fachada já acabou.
      if (v + panes.h + marginV > face.top(u + panes.w)) continue;
      rect(ctx, face, 1, u, v, panes.w, panes.h);
      const sky = Math.min(1, (t.y0 + v) / FULL_HEIGHT);
      out.push({
        m: face.m,
        u,
        v,
        w: panes.w,
        h: panes.h,
        tone: (t.tone ?? 1) * face.glow * (0.78 + next() * 0.22),
        off: (0.1 + 0.13 * sky + next() * 0.04) * face.glow,
      });
    }
    // Guarda-corpo de vidro: uma linha fina clara na base das janelas, de ponta a ponta.
    if (panes.rail !== undefined && v + panes.h + marginV <= face.top(face.width)) {
      rect(ctx, face, face.glow === 1 ? panes.rail : panes.rail * 0.5, 0, v, face.width, 1.5);
    }
  }
}

/** Um corpo: duas fachadas, telhado (reto ou inclinado), aresta clara, platibanda e janelas. */
function tower(ctx: CanvasRenderingContext2D, out: SceneWindow[], t: Tower) {
  const { left, right } = faces(t);
  // Reflexo do céu: o muro clareia com a altura, de modo contínuo entre os recuos (cada recuo pega a sua fatia).
  const lift = (y: number) => 0.16 * Math.min(1, y / FULL_HEIGHT);
  const bottom = lift(t.y0);
  const topLift = lift(t.y0 + t.height);
  polygon(ctx, left, [t.left - 0.08 + bottom, t.left + 0.1 + topLift], [[0, 0], [left.width, 0], [left.width, left.top(left.width)], [0, left.height]]);
  polygon(ctx, right, [t.right - 0.04 + bottom * 0.6, t.right + 0.08 + topLift * 0.6], [[0, 0], [right.width, 0], [right.width, right.height], [0, right.height]]);
  roof(ctx, t);

  // Aresta da frente, contorno da esquerda e platibanda (acompanha a inclinação do telhado).
  rect(ctx, left, 0.92, left.width - 2.5, 0, 2.5, left.top(left.width));
  rect(ctx, left, 0.8, 0, 0, 2, left.height);
  if (t.parapet !== false) {
    polygon(ctx, left, 0.9, [[-2, left.height - 4], [left.width + 2, left.top(left.width) - 4], [left.width + 2, left.top(left.width) + 1], [-2, left.height + 1]]);
    rect(ctx, right, 0.62, -1, right.height - 4, right.width + 3, 5);
  }

  windows(ctx, out, left, t);
  windows(ctx, out, right, t);
}

// Tipos de fachada (vidros em px da cena).
/** Residencial: vidro contínuo recuado entre lajes brancas grossas de varanda, com guarda-corpo de vidro. */
const RESIDENTIAL: Facade = { w: 30, h: 15, pitchU: 34, pitchV: 24, slab: 0.9, slabH: 8, rail: 0.86 };
/** Pódio: o térreo de vidro, mais baixo e largo. */
const PODIUM: Facade = { w: 34, h: 14, pitchU: 40, pitchV: 24, slab: 0.86, slabH: 8 };

/** Meia-largura que acomoda `columns` colunas da fachada (o contrário de `windows`). */
const halfFor = (columns: number, facade: Facade) => (columns * facade.pitchU - (facade.pitchU - facade.w) + 12) / 2;

type Look = Pick<Tower, "gx" | "gz" | "left" | "right" | "top" | "tone" | "depth">;

/** Uma pilha de recuos: cada `[colunas, andares]` é um corpo mais estreito que o de baixo. Devolve a altura em que terminou. */
function stack(ctx: CanvasRenderingContext2D, out: SceneWindow[], look: Look, facade: Facade, y0: number, stages: [number, number][]) {
  let y = y0;
  for (const [columns, floors] of stages) {
    tower(ctx, out, { ...look, a: halfFor(columns, facade), y0: y, height: floors * facade.pitchV, panes: facade });
    y += floors * facade.pitchV;
  }
  return y;
}

/** Um volume liso sem janelas (canteiro, casa de máquinas) de meia-largura `a`, `depth` de profundidade e `height` de altura. */
function mass(ctx: CanvasRenderingContext2D, out: SceneWindow[], look: Look, dx: number, dz: number, y: number, a: number, depth: number, height: number) {
  tower(ctx, out, { ...look, gx: look.gx + dx, gz: look.gz + dz, a, depth, y0: y, height, parapet: false });
}

/** Cobertura: dois canteiros baixos e escuros. */
function planters(ctx: CanvasRenderingContext2D, out: SceneWindow[], look: Look, y: number, a: number, b: number) {
  const dark = { ...look, left: 0.2, right: 0.08, top: 0.24 };
  mass(ctx, out, dark, -a * 0.45, b * 0.25, y, a * 0.28, 0.8, 7);
  mass(ctx, out, dark, a * 0.4, b * 0.3, y, a * 0.2, 0.8, 5);
}

export function drawSkyscraper(ctx: CanvasRenderingContext2D): SceneWindow[] {
  next = random(5);
  const out: SceneWindow[] = [];
  const white = { left: 0.58, right: 0.2, top: 0.6, tone: 1 };

  // Pódio: o térreo largo e baixo, de onde saem a laje e a torre; o terraço dele leva canteiros.
  const base = { ...white, left: 0.46, right: 0.16, tone: 0.8, depth: 0.5, gx: 0, gz: 0 };
  const podiumTop = stack(ctx, out, base, PODIUM, 0, [[7, 2]]);
  planters(ctx, out, base, podiumTop, halfFor(7, PODIUM), halfFor(7, PODIUM) * 0.5);

  // Laje residencial, à esquerda: baixa e comprida, com lajes de varanda e canteiros no telhado.
  const slab = { ...white, left: 0.52, right: 0.18, tone: 0.9, depth: 0.5, gx: -62, gz: 0 };
  const slabTop = stack(ctx, out, slab, RESIDENTIAL, podiumTop, [[4, 5]]);
  planters(ctx, out, slab, slabTop, halfFor(4, RESIDENTIAL), halfFor(4, RESIDENTIAL) * 0.5);

  // Torre, na ponta direita: mais alta, com o topo recuado e a casa de máquinas.
  const core = { ...white, depth: 0.9, gx: 72, gz: 0 };
  const coreTop = stack(ctx, out, core, RESIDENTIAL, podiumTop, [[3, 7], [2, 1]]);
  mass(ctx, out, { ...core, left: 0.5, right: 0.17, top: 0.52 }, -halfFor(2, RESIDENTIAL) * 0.2, 0, coreTop, halfFor(2, RESIDENTIAL) * 0.4, 0.8, 14);
  return out;
}
