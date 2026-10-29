import { drawSkyscraper, SCENE } from "./scene";

/** Lado de cada célula da grade, em unidades da cena: quanto maior, menos partículas (e mais "pixel"). */
export const STEP = 3;
/** Nível (0..255) a partir do qual um pixel do molde é vidro de janela. */
const WINDOW_WHITE = 250;

export interface ParticleSet {
  count: number;
  /** Posição de repouso (centro da célula), em unidades da cena. */
  hx: Float32Array;
  hy: Float32Array;
  /** Tom (0..1) lido do desenho; nas janelas vale o estado aceso/apagado da janela. */
  base: Float32Array;
  /** Janela a que a partícula pertence, ou -1 (parede). */
  win: Int16Array;
  /** Brilho de cada janela quando acesa e quando apagada (o vidro reflete mais o céu no alto). */
  tones: number[];
  offs: number[];
  /** Centro de cada janela, em unidades da cena (o mouse acende as mais próximas). */
  winX: Float32Array;
  winY: Float32Array;
}

/** Desenha a cena num canvas fora da tela e transforma cada célula coberta em uma partícula. */
export function buildParticles(): ParticleSet {
  const canvas = document.createElement("canvas");
  canvas.width = SCENE.width;
  canvas.height = SCENE.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const windows = drawSkyscraper(ctx);
  const pixels = ctx.getImageData(0, 0, SCENE.width, SCENE.height).data;

  const columns = Math.floor(SCENE.width / STEP);
  const rows = Math.floor(SCENE.height / STEP);
  const windowOf = new Int16Array(columns * rows).fill(-1);
  // Células cujo centro cai dentro de cada janela (que é um paralelogramo na tela): testa pela matriz inversa.
  windows.forEach((pane, index) => {
    const [a, b, c, d, e, f] = pane.m;
    const determinant = a * d - b * c;
    const corners = [
      [pane.u, pane.v],
      [pane.u + pane.w, pane.v],
      [pane.u, pane.v + pane.h],
      [pane.u + pane.w, pane.v + pane.h],
    ].map(([u, v]) => [a * u + c * v + e, b * u + d * v + f]);
    const xs = corners.map((corner) => corner[0]);
    const ys = corners.map((corner) => corner[1]);
    for (let row = Math.floor(Math.min(...ys) / STEP); row <= Math.floor(Math.max(...ys) / STEP); row++) {
      for (let column = Math.floor(Math.min(...xs) / STEP); column <= Math.floor(Math.max(...xs) / STEP); column++) {
        if (column < 0 || row < 0 || column >= columns || row >= rows) continue;
        const x = column * STEP + STEP / 2 - e;
        const y = row * STEP + STEP / 2 - f;
        const u = (d * x - c * y) / determinant;
        const v = (-b * x + a * y) / determinant;
        if (u >= pane.u && u < pane.u + pane.w && v >= pane.v && v < pane.v + pane.h) {
          windowOf[row * columns + column] = index;
        }
      }
    }
  });

  const hx: number[] = [];
  const hy: number[] = [];
  const base: number[] = [];
  const win: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = column * STEP + STEP / 2;
      const y = row * STEP + STEP / 2;
      const at = (Math.floor(y) * SCENE.width + Math.floor(x)) * 4;
      if (pixels[at + 3] < 128) continue;
      hx.push(x);
      hy.push(y);
      base.push(pixels[at] / 255);
      // As janelas nascem brancas (nenhuma parede passa de 0,92): se a célula já não é branca, um prédio da frente a cobriu.
      win.push(pixels[at] >= WINDOW_WHITE ? windowOf[row * columns + column] : -1);
    }
  }
  return {
    count: hx.length,
    hx: Float32Array.from(hx),
    hy: Float32Array.from(hy),
    base: Float32Array.from(base),
    win: Int16Array.from(win),
    tones: windows.map((pane) => pane.tone),
    offs: windows.map((pane) => pane.off),
    winX: Float32Array.from(windows, (pane) => pane.m[0] * (pane.u + pane.w / 2) + pane.m[2] * (pane.v + pane.h / 2) + pane.m[4]),
    winY: Float32Array.from(windows, (pane) => pane.m[1] * (pane.u + pane.w / 2) + pane.m[3] * (pane.v + pane.h / 2) + pane.m[5]),
  };
}
