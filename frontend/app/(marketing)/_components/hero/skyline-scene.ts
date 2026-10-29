/**
 * Gera a cena do skyline do hero: prédios (retângulos) e janelas (recortes), em pixels de CSS.
 * Os prédios formam um "vale": baixos no centro (sob o texto) e altos nas laterais.
 * Determinístico (semente fixa): a mesma cena a cada carga, só reescalada ao tamanho da tela.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SkylineScene {
  /** Prédios, com um tom de 0 (mais claro) a 2 (mais escuro) para dar profundidade. */
  bodies: (Rect & { tone: number })[];
  windows: Rect[];
  /** Camada de fundo: prédios mais altos e sem janelas, desenhados claros atrás dos da frente. */
  back: Rect[];
}

export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Grade única de janelas para a cidade inteira: mesmo tamanho e espaçamento em todos os prédios,
 * alinhada ao chão e à persiana (cada janela ocupa duas linhas de 4 px), então janelas de prédios
 * vizinhos ficam na mesma linha e coluna.
 */
export const WINDOW = { column: 14, row: 16, width: 7, height: 8 } as const;
const MARGIN = { side: 5, top: 10, bottom: 8 };

function addWindows(block: Rect, ground: number, windows: Rect[]) {
  const firstColumn = Math.ceil((block.x + MARGIN.side) / WINDOW.column) * WINDOW.column;
  for (let bottom = ground - MARGIN.bottom; bottom - WINDOW.height >= block.y + MARGIN.top; bottom -= WINDOW.row) {
    if (bottom > block.y + block.h - MARGIN.bottom + 0.01) continue;
    for (let x = firstColumn; x + WINDOW.width <= block.x + block.w - MARGIN.side; x += WINDOW.column) {
      windows.push({ x, y: bottom - WINDOW.height, w: WINDOW.width, h: WINDOW.height });
    }
  }
}

/** "valley": baixos no centro e altos nas laterais (hero); "hill": o contrário, altos no meio e baixos nas pontas (fecho da página). */
export type SkylineShape = "valley" | "hill";

const SEEDS = { valley: [804, 311], hill: [517, 902] } as const;

export function buildSkyline(width: number, height: number, shape: SkylineShape = "valley"): SkylineScene {
  const [frontSeed, backSeed] = SEEDS[shape];
  return { ...buildLayer(width, height, frontSeed, 1, shape), back: buildLayer(width, height, backSeed, 1.15, shape).bodies };
}

/** Uma camada de prédios; `scale` aumenta as alturas (a camada de fundo é mais alta). */
function buildLayer(width: number, height: number, seed: number, scale: number, shape: SkylineShape) {
  const next = random(seed);
  const bodies: SkylineScene["bodies"] = [];
  const windows: Rect[] = [];

  // Passa um pouco das bordas: o parallax do mouse desloca a cena sem mostrar vãos.
  let x = -40;
  while (x < width + 40) {
    const w = Math.max(44, width * (0.035 + next() * 0.05));
    const center = (x + w / 2) / width;
    const distance = Math.min(Math.abs(center - 0.5) / 0.5, 1); // 0 no centro, 1 nas bordas
    const reach = shape === "valley" ? Math.pow(distance, 1.8) : Math.pow(1 - distance, 1.3);
    const peak = Math.min(height * scale * (0.085 + 0.66 * reach), height);
    const h = peak * (0.72 + next() * 0.28);
    const tone = next() < 0.3 ? 2 : next() < 0.5 ? 1 : 0;

    if (shape === "hill" || distance > 0.18 || next() < 0.9) {
      const body = { x, y: height - h, w, h };
      bodies.push({ ...body, tone });
      if (h > 50) addWindows(body, height, windows);

      // Recuo no topo (andar menor) e detalhes de cobertura: caixa d'água ou antena.
      if (h > 90 && next() < 0.55) {
        const tier = { x: x + w * 0.18, y: height - h - h * 0.14, w: w * 0.64, h: h * 0.14 };
        bodies.push({ ...tier, tone });
        if (tier.h > 40) addWindows(tier, height, windows);
      }
      const roof = bodies[bodies.length - 1];
      if (h > 70 && next() < 0.5) {
        bodies.push({ x: roof.x + roof.w * 0.6, y: roof.y - 14, w: Math.min(22, roof.w * 0.3), h: 14, tone });
      } else if (h > 120 && next() < 0.4) {
        bodies.push({ x: roof.x + roof.w * 0.3, y: roof.y - 34, w: 2, h: 34, tone });
      }
    }
    x += w + 4 + next() * 7;
  }
  return { bodies, windows };
}
