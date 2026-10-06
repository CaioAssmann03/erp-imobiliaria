/**
 * Prédio 3D em arte ASCII girando (o efeito clássico do "donut" em ASCII). Um minúsculo
 * ray caster: para cada caractere da grade lança um raio (câmera ortográfica) contra
 * caixas alinhadas aos eixos, gira a cena em Y e escolhe o caractere pela luz (quanto mais
 * luz, mais denso o caractere), com realce nas arestas para dar volume.
 * Função pura: mesmo (angle, opções) => mesmo texto (serve para SSR e testes).
 */

type Vec3 = [number, number, number];

interface Box {
  min: Vec3;
  max: Vec3;
  /** Janelas nas faces laterais: largura da coluna, altura do andar e onde começam (y). */
  windows?: { column: number; floor: number; y0: number };
  /** Faixa de vidro contínua (térreo/lobby) entre y0 e y1, só com os pilares sem vidro. */
  lobby?: { y0: number; y1: number; column: number };
}

// Torre esbelta de escritórios sobre uma base com degraus e marquise, com térreo de vidro,
// platibanda e casas de máquinas no telhado, e uma ala baixa ao lado.
const T = 0.7; // meia largura da torre
const BOXES: Box[] = [
  { min: [-1.05, -1.3, -1.05], max: [1.05, -1.2, 1.05] }, // base
  {
    min: [-T, -1.2, -T],
    max: [T, 1.5, T],
    windows: { column: 0.175, floor: 0.24, y0: -0.62 },
    lobby: { y0: -1.15, y1: -0.74, column: 0.35 },
  }, // torre
  { min: [-T - 0.08, 1.5, -T - 0.08], max: [T + 0.08, 1.58, T + 0.08] }, // cornija
  { min: [-T - 0.08, 1.58, -T - 0.08], max: [T + 0.08, 1.67, -T] }, // platibanda (norte)
  { min: [-T - 0.08, 1.58, T], max: [T + 0.08, 1.67, T + 0.08] }, // platibanda (sul)
  { min: [-T - 0.08, 1.58, -T], max: [-T, 1.67, T] }, // platibanda (oeste)
  { min: [T, 1.58, -T], max: [T + 0.08, 1.67, T] }, // platibanda (leste)
  { min: [-0.4, 1.58, -0.25], max: [0.12, 1.92, 0.3] }, // casa de máquinas
  { min: [0.3, 1.58, 0.05], max: [0.55, 1.8, 0.4] }, // caixa d'água
  {
    min: [-1.5, -1.2, -0.45],
    max: [-T, -0.2, 0.5],
    windows: { column: 0.2, floor: 0.24, y0: -0.7 },
  }, // ala baixa
  { min: [-0.36, -0.74, T], max: [0.36, -0.62, 1.05] }, // marquise da entrada
  { min: [-0.45, -1.2, T], max: [0.45, -1.1, 1.0] }, // degraus
];

const PITCH = -0.4; // câmera olhando um pouco de cima
const LIGHT: Vec3 = normalize([-0.5, 0.7, -0.5]); // direção até a luz (espaço da câmera)
const CHAR_ASPECT = 0.55; // largura / altura de um caractere
const VIEW_HEIGHT = 4.5; // altura do mundo visível na grade
const EDGE = 0.05; // espessura do realce nas arestas
const RAMP = ".,-~:;=!*#$@"; // do mais leve ao mais denso
// Matriz de Bayer 4x4: ruído ordenado que quebra as faixas planas de cada face.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(...v);
  return [v[0] / length, v[1] / length, v[2] / length];
}

const rotX = (v: Vec3, a: number): Vec3 => [
  v[0],
  v[1] * Math.cos(a) - v[2] * Math.sin(a),
  v[1] * Math.sin(a) + v[2] * Math.cos(a),
];

const rotY = (v: Vec3, a: number): Vec3 => [
  v[0] * Math.cos(a) + v[2] * Math.sin(a),
  v[1],
  -v[0] * Math.sin(a) + v[2] * Math.cos(a),
];

interface Hit {
  t: number;
  axis: 0 | 1 | 2;
  sign: 1 | -1;
  box: Box;
}

function intersect(origin: Vec3, dir: Vec3): Hit | null {
  let best: Hit | null = null;
  for (const box of BOXES) {
    let tNear = -Infinity;
    let tFar = Infinity;
    let axisNear: 0 | 1 | 2 = 0;
    for (const axis of [0, 1, 2] as const) {
      if (Math.abs(dir[axis]) < 1e-9) {
        if (origin[axis] < box.min[axis] || origin[axis] > box.max[axis]) {
          tNear = Infinity;
          break;
        }
        continue;
      }
      const t1 = (box.min[axis] - origin[axis]) / dir[axis];
      const t2 = (box.max[axis] - origin[axis]) / dir[axis];
      const near = Math.min(t1, t2);
      if (near > tNear) {
        tNear = near;
        axisNear = axis;
      }
      tFar = Math.min(tFar, Math.max(t1, t2));
    }
    if (tNear <= tFar && tFar > 0 && (!best || tNear < best.t)) {
      best = { t: tNear, axis: axisNear, sign: dir[axisNear] > 0 ? -1 : 1, box };
    }
  }
  return best;
}

export interface BuildingOptions {
  angle: number;
  cols?: number;
  rows?: number;
  /** true quando a tinta é clara sobre fundo escuro (luz forte = caractere denso). */
  lightOnDark?: boolean;
}

export function renderBuilding({
  angle,
  cols = 64,
  rows = 40,
  lightOnDark = false,
}: BuildingOptions): string {
  const cellH = VIEW_HEIGHT / rows;
  const cellW = cellH * CHAR_ASPECT;
  const lines: string[] = [];

  for (let j = 0; j < rows; j++) {
    let line = "";
    for (let i = 0; i < cols; i++) {
      const sx = (i + 0.5 - cols / 2) * cellW;
      const sy = -(j + 0.5 - rows / 2) * cellH + 0.3;

      // Raio no espaço da câmera -> espaço do objeto.
      const origin = rotY(rotX([sx, sy, -10], -PITCH), -angle);
      const dir = rotY(rotX([0, 0, 1], -PITCH), -angle);
      const hit = intersect(origin, dir);
      if (!hit) {
        line += " ";
        continue;
      }

      // Luz difusa: normal do objeto -> espaço da câmera.
      const normal: Vec3 = [0, 0, 0];
      normal[hit.axis] = hit.sign;
      const nCam = rotX(rotY(normal, angle), PITCH);
      const diffuse = Math.max(0, nCam[0] * LIGHT[0] + nCam[1] * LIGHT[1] + nCam[2] * LIGHT[2]);
      let brightness = 0.42 + 0.58 * diffuse; // paredes mais claras: as janelas escuras se destacam

      // Realce nas arestas da face (dá volume e contorno).
      const point: Vec3 = [
        origin[0] + dir[0] * hit.t,
        origin[1] + dir[1] * hit.t,
        origin[2] + dir[2] * hit.t,
      ];
      let edgeDistance = Infinity;
      for (const axis of [0, 1, 2] as const) {
        if (axis === hit.axis) continue;
        edgeDistance = Math.min(edgeDistance, point[axis] - hit.box.min[axis], hit.box.max[axis] - point[axis]);
      }
      if (edgeDistance < EDGE) brightness = Math.min(1, brightness + 0.35);

      // Leve degradê vertical (mais claro no alto).
      brightness += (point[1] + 1.25) * 0.04;
      const dither = (BAYER[(j % 4) * 4 + (i % 4)] / 16 - 0.5) * 0.12;
      const toDensity = (value: number) => Math.min(Math.max(lightOnDark ? value : 1 - value, 0), 0.999);
      let density = toDensity(brightness + dither); // parede: com ruído ordenado

      // Vidro: sempre bem mais escuro que a parede, à luz e à sombra (em tinta escura = caractere
      // denso; em tinta clara = pouco denso), sem ruído para o retângulo ficar limpo.
      const { windows, lobby } = hit.box;
      if (hit.axis !== 1) {
        const along = hit.axis === 0 ? point[2] - hit.box.min[2] : point[0] - hit.box.min[0];
        let glass = false;
        if (lobby && point[1] >= lobby.y0 && point[1] < lobby.y1) {
          const fu = (along / lobby.column) % 1;
          glass = fu > 0.08 && fu < 0.92;
        } else if (windows && point[1] >= windows.y0 && point[1] < hit.box.max[1] - 0.1) {
          const fu = (along / windows.column) % 1;
          const fv = ((point[1] - windows.y0) / windows.floor) % 1;
          glass = fu > 0.14 && fu < 0.86 && fv < 0.52; // uma linha de janela a cada dois andares-linha
        }
        if (glass) {
          const wallDarkness = 1 - Math.min(Math.max(brightness, 0), 1);
          const glassDarkness = 0.86 + 0.14 * wallDarkness;
          density = Math.min(lightOnDark ? 1 - glassDarkness : glassDarkness, 0.999);
        }
      }
      line += RAMP[Math.floor(Math.min(Math.max(density, 0), 0.999) * RAMP.length)];
    }
    lines.push(line);
  }
  return lines.join("\n");
}
