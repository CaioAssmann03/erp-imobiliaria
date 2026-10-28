/**
 * Pré-renderização do skyline: as partes fixas (prédios, janelas e a persiana) são desenhadas uma
 * vez por tamanho de tela em canvases fora da tela; cada quadro só cola essas imagens.
 */

import type { SkylineScene } from "./skyline-scene";

/** Margem lateral das camadas: o parallax desloca a cena sem mostrar vãos nas bordas. */
export const PAD = 40;
/** Deslocamento máximo do parallax (px) da camada da frente e da de fundo (em sentido oposto). */
export const PARALLAX_FRONT = 14;
export const PARALLAX_BACK = -8;
/** Espessura da linha e o vão entre linhas (px de CSS): o efeito de "persiana". Inteiros, alinhados à grade de janelas. */
export const LINE = 2;
export const PITCH = 4;

export interface SkylineColors {
  tones: string[];
  /** Janela apagada (padrão) e acesa. */
  ink: string;
  light: string;
}

export interface SkylineLayers {
  back: HTMLCanvasElement;
  front: HTMLCanvasElement;
  /** Máscara da persiana: as faixas a apagar por cima das janelas apagadas. */
  stripes: HTMLCanvasElement;
}

function layer(width: number, height: number, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const context = canvas.getContext("2d")!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { canvas, context };
}

function drawStripes(context: CanvasRenderingContext2D, width: number, height: number) {
  // Linhas contadas a partir do chão, como as janelas: cada janela cobre exatamente duas linhas.
  for (let y = height - LINE; y > 0; y -= PITCH) context.fillRect(0, y - (PITCH - LINE), width, PITCH - LINE);
}

export function renderLayers(scene: SkylineScene, width: number, height: number, ratio: number, colors: SkylineColors): SkylineLayers {
  const wide = width + PAD * 2;

  const back = layer(wide, height, ratio);
  back.context.globalAlpha = 0.35;
  back.context.fillStyle = colors.tones[0];
  for (const body of scene.back) back.context.fillRect(body.x + PAD, body.y, body.w, body.h);

  const front = layer(wide, height, ratio);
  for (const body of scene.bodies) {
    front.context.fillStyle = colors.tones[body.tone];
    front.context.fillRect(body.x + PAD, body.y, body.w, body.h);
  }
  // Todas as janelas começam apagadas, na mesma cor; as acesas são pintadas por cima a cada quadro.
  front.context.fillStyle = colors.ink;
  for (const window of scene.windows) front.context.fillRect(window.x + PAD, window.y, window.w, window.h);

  const stripes = layer(wide, height, ratio);
  drawStripes(stripes.context, wide, height);

  // A persiana já sai aplicada nas camadas fixas.
  for (const { context } of [back, front]) {
    context.globalAlpha = 1;
    context.globalCompositeOperation = "destination-out";
    context.drawImage(stripes.canvas, 0, 0, wide, height);
    context.globalCompositeOperation = "source-over";
  }
  return { back: back.canvas, front: front.canvas, stripes: stripes.canvas };
}
