import { HOUSE_LOGO_PATH } from "@/components/brand/HouseLogo";

/**
 * Desenha o logo da casa em 3D num canvas 2D em tons de cinza: o canvas só serve de molde, o tom vira a cor da partícula
 * (`particles.ts`: 0 = laranja queimado, 0,5 = laranja, 1 = laranja claro). O logo é extrudado: a frente fica numa
 * fachada inclinada (como a fachada da esquerda de um prédio isométrico, com `u` para o lado e `v` para cima) e cada
 * aresta do contorno vira uma lateral que se afasta para trás, à direita e para cima. A lateral que olha para a direita
 * fica na sombra; as que olham para cima pegam luz.
 *
 * As faixas horizontais da esquerda do logo fazem o papel das janelas do prédio: acendem e apagam sozinhas e o mouse as
 * acende de perto.
 */

export const SCENE = { width: 340, height: 420 } as const;

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
  /** Brilho da janela apagada. */
  off: number;
}

type Point = [number, number];

// O desenho do logo (`HOUSE_LOGO_PATH`) está num quadro de 1061,5 × 1120,5, com o y para baixo.
const LOGO = { width: 1061.5, height: 1120.5 } as const;
const SCALE = 0.28; // unidades do logo para unidades da cena
const FACE_HEIGHT = LOGO.height * SCALE;

const TURN = (24 * Math.PI) / 180; // quanto o logo gira em torno do eixo vertical
const PITCH = 0.5; // quanto a vista olha de cima (1 = de topo)
const ORIGIN = { x: 19, y: 334 }; // canto de baixo à esquerda da frente
/**
 * Para onde a profundidade aponta na tela: para trás, à direita e só um pouco para cima, menos do que o vão entre duas
 * faixas (14,6), para o topo de uma não cobrir o vão e as faixas continuarem separadas.
 */
const DEPTH: Point = [46, -12];

const FACE: Matrix = [Math.cos(TURN), Math.sin(TURN) * PITCH, 0, -1, ORIGIN.x, ORIGIN.y];

/** Tons (0..1) do molde. */
const FRONT = [0.5, 0.64] as const; // da base ao topo da frente
const SIDE_SHADE = 0.2; // lateral que olha para a direita
const SIDE_LIT = 0.88; // lateral que olha para cima
const BACK_FADE = 0.8; // quanto a lateral escurece até o fundo

const GLASS_OFF = 0.3;
const GLASS_LIT = 1;

/** Faixas do logo que funcionam como janelas: [topo, base] no quadro do logo, sempre de x = 0 até `BAR_REACH`. */
const BAR_REACH = 218;
const BARS: [number, number][] = [
  [997.959, 1032.971],
  [910.43, 944.469],
  [821.928, 856.94],
  [734.399, 769.411],
  [645.897, 680.909],
  [558.368, 592.407],
  [469.866, 504.878],
];

/** Os polígonos do logo (o contorno e o vão da casa), já no espaço da fachada: `u` para o lado, `v` para cima. */
function outlines(): Point[][] {
  return HOUSE_LOGO_PATH.split("Z")
    .map((part) => (part.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number))
    .filter((numbers) => numbers.length >= 6)
    .map((numbers) => {
      const points: Point[] = [];
      for (let i = 0; i < numbers.length; i += 2) points.push([numbers[i] * SCALE, (LOGO.height - numbers[i + 1]) * SCALE]);
      return points;
    });
}

const toScreen = ([u, v]: Point): Point => [FACE[0] * u + FACE[4], FACE[1] * u + FACE[3] * v + FACE[5]];

/** Dentro do material? (par-ímpar, conta os cruzamentos de um raio para a direita.) */
function isSolid(shapes: Point[][], [u, v]: Point) {
  let inside = false;
  for (const shape of shapes) {
    for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
      const [ui, vi] = shape[i];
      const [uj, vj] = shape[j];
      if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) inside = !inside;
    }
  }
  return inside;
}

const gray = (level: number) => {
  const value = Math.round(Math.min(Math.max(level, 0), 1) * 255);
  return `rgb(${value},${value},${value})`;
};

interface Side {
  from: Point;
  to: Point;
  /** Tom da lateral (0..1), pela direção para a qual ela olha. */
  level: number;
  /** Posição ao longo da profundidade: as de mais à frente são desenhadas por último. */
  order: number;
}

/** As laterais visíveis: as arestas cujo lado de fora está do mesmo lado para onde a profundidade se afasta. */
function sides(shapes: Point[][]): Side[] {
  const result: Side[] = [];
  for (const shape of shapes) {
    for (let i = 0; i < shape.length; i++) {
      const from = shape[i];
      const to = shape[(i + 1) % shape.length];
      const du = to[0] - from[0];
      const dv = to[1] - from[1];
      const length = Math.hypot(du, dv);
      if (length === 0) continue;

      // Normal para fora do material: a que, um passinho adiante, cai fora dele.
      let nu = -dv / length;
      let nv = du / length;
      const middle: Point = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
      if (isSolid(shapes, [middle[0] + nu * 0.05, middle[1] + nv * 0.05])) {
        nu = -nu;
        nv = -nv;
      }

      // Na tela, a lateral só aparece se a profundidade aponta para fora do material por esta aresta.
      const a = toScreen(from);
      const b = toScreen(to);
      const outward: Point = [FACE[0] * nu, FACE[1] * nu + FACE[3] * nv]; // a normal, levada à tela
      let screenNormal: Point = [-(b[1] - a[1]), b[0] - a[0]];
      if (screenNormal[0] * outward[0] + screenNormal[1] * outward[1] < 0) screenNormal = [-screenNormal[0], -screenNormal[1]];
      if (screenNormal[0] * DEPTH[0] + screenNormal[1] * DEPTH[1] <= 0) continue;

      const [mx, my] = toScreen(middle);
      result.push({ from, to, level: SIDE_SHADE + (SIDE_LIT - SIDE_SHADE) * Math.max(0, nv), order: mx * DEPTH[0] + my * DEPTH[1] });
    }
  }
  return result.sort((x, y) => x.order - y.order);
}

export function drawLogo(ctx: CanvasRenderingContext2D): SceneWindow[] {
  const shapes = outlines();

  // Laterais, de trás para a frente, cada uma com um degradê que escurece para o fundo.
  for (const side of sides(shapes)) {
    const a = toScreen(side.from);
    const b = toScreen(side.to);
    const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const gradient = ctx.createLinearGradient(mx, my, mx + DEPTH[0], my + DEPTH[1]);
    gradient.addColorStop(0, gray(side.level));
    gradient.addColorStop(1, gray(side.level * BACK_FADE));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(b[0] + DEPTH[0], b[1] + DEPTH[1]);
    ctx.lineTo(a[0] + DEPTH[0], a[1] + DEPTH[1]);
    ctx.closePath();
    ctx.fill();
  }

  // A frente: o logo todo, mais claro para cima, na fachada inclinada.
  const face = new Path2D();
  for (const shape of shapes) {
    shape.forEach(([u, v], i) => (i === 0 ? face.moveTo(u, v) : face.lineTo(u, v)));
    face.closePath();
  }
  ctx.save();
  ctx.setTransform(...FACE);
  const gradient = ctx.createLinearGradient(0, 0, 0, FACE_HEIGHT);
  gradient.addColorStop(0, gray(FRONT[0]));
  gradient.addColorStop(1, gray(FRONT[1]));
  ctx.fillStyle = gradient;
  ctx.fill(face);

  // As faixas da esquerda nascem brancas: é como `particles.ts` as reconhece como janelas.
  ctx.clip(face);
  ctx.fillStyle = "#fff";
  const windows: SceneWindow[] = BARS.map(([top, bottom]) => {
    const u = 0;
    const v = (LOGO.height - bottom) * SCALE;
    const w = BAR_REACH * SCALE;
    const h = (bottom - top) * SCALE;
    ctx.fillRect(u, v, w, h);
    return { m: FACE, u, v, w, h, tone: GLASS_LIT, off: GLASS_OFF };
  });
  ctx.restore();
  return windows;
}
