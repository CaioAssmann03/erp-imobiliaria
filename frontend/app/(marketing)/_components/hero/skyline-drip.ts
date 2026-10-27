/**
 * Base do skyline "escorrendo" em pixels, num canvas próprio logo abaixo do chão. Cada coluna de quadrados continua o
 * prédio de cima (mesmo tom e mesma persiana) e desce até um comprimento próprio. Tudo é pré-renderizado uma vez por
 * tamanho; cada quadro só copia, por coluna, a fatia de cima até onde o derretimento chegou.
 * Determinístico (semente fixa), como a cena.
 */

import { LINE, PAD, PITCH, type SkylineColors } from "./skyline-layers";
import { random, type SkylineScene } from "./skyline-scene";

/** Lado da célula e do quadrado (px de CSS); o quadrado tem três linhas da persiana. */
const CELL = 16;
const SQUARE = 12;
/** Linhas de quadrados sempre à vista, antes de derreter: a base dos prédios já termina em pixels. */
const BASE_ROWS = 1;
/** Opacidade da camada de fundo (a mesma de `renderLayers`), usada nos vãos entre prédios. */
const BACK_ALPHA = 0.35;

export interface DripColumn {
  x: number;
  /** Limiar de cada linha, de cima para baixo e crescente: a linha aparece quando o derretimento passa dele. */
  at: number[];
}

export interface SkylineDrip {
  /** Faixa inteira já escorrida, com a margem `PAD` dos lados (parallax). */
  image: HTMLCanvasElement;
  columns: DripColumn[];
  ratio: number;
}

/** Tom do prédio da frente que toca o chão em `x`, ou -1 num vão. */
function toneAt(scene: SkylineScene, x: number, ground: number) {
  const body = scene.bodies.find((b) => Math.abs(b.y + b.h - ground) < 0.5 && x >= b.x && x < b.x + b.w);
  return body ? body.tone : -1;
}

/** Um quadrado com a persiana: linhas de `LINE` px na grade de `PITCH`, continuando a dos prédios abaixo do chão. */
function square(context: CanvasRenderingContext2D, x: number, y: number) {
  for (let line = PITCH - LINE; line < SQUARE; line += PITCH) context.fillRect(x, y + line, SQUARE, LINE);
}

export function buildDrip(scene: SkylineScene, width: number, ground: number, height: number, ratio: number, colors: SkylineColors): SkylineDrip {
  const next = random(977);
  const rows = Math.floor(height / CELL) - 1;
  const image = document.createElement("canvas");
  image.width = Math.round((width + PAD * 2) * ratio);
  image.height = Math.round(height * ratio);
  const context = image.getContext("2d")!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const columns: DripColumn[] = [];

  for (let x = -2 * CELL; x < width + 2 * CELL; x += CELL) {
    const tone = toneAt(scene, x + CELL / 2, ground);
    context.fillStyle = colors.tones[Math.max(0, tone)];
    context.globalAlpha = tone < 0 ? BACK_ALPHA : 1;
    // Poucos fios longos, muitos curtos; nos vãos, só a franja.
    const length = tone < 0 ? BASE_ROWS + Math.floor(next() * 2) : BASE_ROWS + 1 + Math.floor(Math.pow(next(), 1.2) * (rows - BASE_ROWS - 3));
    const speed = 0.8 + next() * 0.5;
    const at: number[] = [];

    for (let row = 0; row < length; row++) {
      at.push(row < BASE_ROWS ? 0 : 0.93 * Math.pow((row - BASE_ROWS + 1) / (length - BASE_ROWS + 1), speed));
      // O fio vai se desfazendo até a ponta; a primeira linha quase nunca falha.
      if (next() < 0.06 + 0.3 * (row / length)) continue;
      square(context, x + PAD, row * CELL);
    }
    // Uma gota solta abaixo da ponta, em parte dos fios (a linha vazia entre os dois entra na fatia antes dela).
    if (tone >= 0 && length > 4 && next() < 0.35) {
      at.push(0.95, 0.97);
      square(context, x + PAD, (length + 1) * CELL);
    }
    columns.push({ x, at });
  }
  context.globalAlpha = 1;
  return { image, columns, ratio };
}

/** Cola, por coluna, a fatia de cima com as linhas cujo limiar está abaixo de `melt`. */
export function drawDrip(context: CanvasRenderingContext2D, drip: SkylineDrip, melt: number, offset: number) {
  const { image, columns, ratio } = drip;
  for (const column of columns) {
    let rows = 0;
    while (rows < column.at.length && column.at[rows] <= melt) rows++;
    if (!rows) continue;
    const h = rows * CELL;
    context.drawImage(image, (column.x + PAD) * ratio, 0, CELL * ratio, h * ratio, column.x + offset, 0, CELL, h);
  }
}
