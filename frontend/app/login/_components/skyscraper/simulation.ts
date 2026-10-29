import { random } from "@/app/(marketing)/_components/hero/skyline-scene";
import { brandRamp } from "@/lib/brand-ramp";

import { STEP, type ParticleSet } from "./particles";
import { SCENE } from "./scene";

// Unidades da cena e quadros de 60 fps.
const PAD = 64; // folga do canvas além do prédio (px de tela), para as partículas que voam para fora
const RADIUS = 48; // raio do empurrão do mouse (suave: o principal é a luz)
const PUSH = 1.8; // empurrão máximo por quadro
const LIGHT_RADIUS = 130; // raio da luz do mouse sobre as janelas
const SPRING = 0.035; // força que traz cada partícula de volta
const DAMPING = 0.86;
const BUCKETS = 12; // tons (as partículas são desenhadas em lotes por tom)
const LIT_RATIO = 0.2; // janelas acesas sozinhas (poucas: o círculo do mouse precisa se destacar)
const STILL_LIT_RATIO = 0.4; // sem animação (só o desenho parado)
const TOGGLES_PER_SECOND = 10;
const WINDOW_EASE = 0.98; // fração do caminho até o alvo percorrida por segundo
const BUILD_MS = 900; // quanto o prédio leva para começar a subir, do chão ao topo (cada partícula sai na sua vez)
const RISE_MS = 1100; // quanto cada partícula leva para subir da base até o seu lugar

/**
 * O arranha-céu como nuvem de partículas quadradas num canvas: ao abrir, as partículas sobem de baixo da cena (as do chão primeiro), algumas janelas acendem
 * e apagam sozinhas, o mouse acende as janelas de perto (como na home) e empurra de leve as partículas, que voltam. Só redesenha quando algo muda (parado, não gasta nada).
 */
export function createSimulation(canvas: HTMLCanvasElement, set: ParticleSet, animate: boolean) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível");
  const { count, hx, hy, base, win, tones, offs, winX, winY } = set;

  const ox = new Float32Array(count);
  const oy = new Float32Array(count);
  const vx = new Float32Array(count);
  const vy = new Float32Array(count);
  const delay = new Float32Array(count);
  const startX = new Float32Array(count);
  const startY = new Float32Array(count);
  const next = random(11);
  // Acesa sozinha (0/1) e a luz de cada janela agora (0..1, suavizada até o alvo: automático ou mouse).
  const ratio = animate ? LIT_RATIO : STILL_LIT_RATIO;
  const autoLit = Uint8Array.from(tones, () => (next() < ratio ? 1 : 0));
  const glow = Float32Array.from(autoLit);

  if (animate) {
    for (let i = 0; i < count; i++) {
      // Cada partícula sai de baixo da cena (com um pouco de largura) e sobe até o seu lugar.
      startX[i] = (next() - 0.5) * 60;
      startY[i] = SCENE.height - hy[i] + 40 + next() * 140;
      ox[i] = startX[i];
      oy[i] = startY[i];
      delay[i] = (1 - hy[i] / SCENE.height) * BUILD_MS + next() * 160;
    }
  }

  const levelOf = (i: number) => (win[i] >= 0 ? offs[win[i]] + (tones[win[i]] - offs[win[i]]) * glow[win[i]] : base[i]);
  const order = new Uint32Array(count);
  const starts = new Int32Array(BUCKETS + 1);

  /** Agrupa as partículas por nível de transparência (ordenação por contagem). */
  const rebuildBuckets = () => {
    const bucket = new Uint8Array(count);
    starts.fill(0);
    for (let i = 0; i < count; i++) {
      bucket[i] = Math.min(BUCKETS - 1, Math.floor(levelOf(i) * BUCKETS));
      starts[bucket[i] + 1]++;
    }
    for (let b = 0; b < BUCKETS; b++) starts[b + 1] += starts[b];
    const cursor = starts.slice(0, BUCKETS);
    for (let i = 0; i < count; i++) order[cursor[bucket[i]]++] = i;
  };
  rebuildBuckets();

  let scale = 1;
  let cssWidth = 0;
  let cssHeight = 0;
  let palette: string[] = Array(BUCKETS).fill("#f05a28");
  let pointer: { x: number; y: number } | null = null;
  let needsDraw = true;
  let frame = 0;

  /** Lê os tokens de destaque do tema público (os do canvas, não os do <html>) e monta a paleta: do laranja queimado (tom 0) ao claro (tom 1). */
  const readColor = () => {
    const ramp = brandRamp(canvas);
    palette = Array.from({ length: BUCKETS }, (_, b) => ramp((b + 0.5) / BUCKETS));
    needsDraw = true;
  };

  /** `width` e `height` são o tamanho do prédio na tela (px de CSS), sem a folga. */
  const resize = (width: number, height: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = width + PAD * 2;
    cssHeight = height + PAD * 2;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.style.left = `${-PAD}px`;
    canvas.style.top = `${-PAD}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = width / SCENE.width;
    needsDraw = true;
  };

  const draw = () => {
    ctx.clearRect(0, 0, cssWidth, cssHeight);
    const size = STEP * scale * 0.92;
    for (let b = 0; b < BUCKETS; b++) {
      ctx.fillStyle = palette[b];
      for (let k = starts[b]; k < starts[b + 1]; k++) {
        const i = order[k];
        ctx.fillRect(PAD + (hx[i] + ox[i]) * scale - size / 2, PAD + (hy[i] + oy[i]) * scale - size / 2, size, size);
      }
    }
  };

  /** Avança a física; devolve true enquanto alguma partícula ainda está fora do lugar. */
  const step = (scaleDt: number, elapsed: number) => {
    const damping = Math.pow(DAMPING, scaleDt);
    let moving = false;
    for (let i = 0; i < count; i++) {
      if (elapsed < delay[i]) {
        moving = true;
        continue;
      }
      // Subida de entrada: desacelera até o lugar (sem mola, para não passar do ponto); o mouse só age depois.
      const rise = (elapsed - delay[i]) / RISE_MS;
      if (rise < 1) {
        const eased = 1 - (1 - rise) ** 3;
        ox[i] = startX[i] * (1 - eased);
        oy[i] = startY[i] * (1 - eased);
        moving = true;
        continue;
      }
      if (pointer) {
        const dx = hx[i] + ox[i] - pointer.x;
        const dy = hy[i] + oy[i] - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < RADIUS) {
          const strength = (1 - distance / RADIUS) ** 2 * PUSH * scaleDt;
          const nx = dx / (distance || 1);
          const ny = dy / (distance || 1);
          // Parte do empurrão vai de lado: espalha em leque em vez de em linha reta.
          const side = ((i * 2654435761) % 1000) / 500 - 1;
          vx[i] += (nx - ny * side * 0.8) * strength;
          vy[i] += (ny + nx * side * 0.8) * strength;
        }
      }
      vx[i] = (vx[i] - SPRING * ox[i] * scaleDt) * damping;
      vy[i] = (vy[i] - SPRING * oy[i] * scaleDt) * damping;
      ox[i] += vx[i] * scaleDt;
      oy[i] += vy[i] * scaleDt;
      if (Math.abs(ox[i]) + Math.abs(oy[i]) + Math.abs(vx[i]) + Math.abs(vy[i]) < 0.03) {
        ox[i] = oy[i] = vx[i] = vy[i] = 0;
      } else {
        moving = true;
      }
    }
    return moving;
  };

  /** Luz das janelas: o mouse acende as de perto (com queda suave); sozinhas acendem e apagam algumas. Devolve true se mudou. */
  const updateWindows = (seconds: number) => {
    if (autoLit.length > 0 && next() < TOGGLES_PER_SECOND * seconds) {
      const index = Math.floor(next() * autoLit.length);
      autoLit[index] = autoLit[index] ? 0 : next() < LIT_RATIO / (1 - LIT_RATIO) ? 1 : 0; // equilíbrio em LIT_RATIO
    }
    const step = 1 - Math.pow(1 - WINDOW_EASE, seconds);
    let changed = false;
    for (let w = 0; w < glow.length; w++) {
      let target = autoLit[w];
      if (pointer) {
        const reach = Math.min(1, 2 * Math.max(0, 1 - Math.hypot(winX[w] - pointer.x, winY[w] - pointer.y) / LIGHT_RADIUS));
        target = Math.max(target, reach * reach * (3 - 2 * reach));
      }
      const delta = (target - glow[w]) * step;
      if (Math.abs(target - glow[w]) > 0.004) changed = true;
      glow[w] += delta;
    }
    return changed;
  };

  const start = performance.now();
  let last = start;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    // O 1º quadro pode vir com hora anterior à de `performance.now()` no início: nunca anda para trás.
    const scaleDt = Math.min(Math.max((now - last) / (1000 / 60), 0), 3);
    last = now;
    let dirty = needsDraw;
    needsDraw = false;
    if (animate) {
      if (step(scaleDt, now - start)) dirty = true;
      if (updateWindows(scaleDt / 60)) {
        rebuildBuckets();
        dirty = true;
      }
    }
    if (dirty) draw();
  };

  return {
    resize,
    readColor,
    /** Posição do mouse em px de tela relativa ao prédio, ou `null` quando sai. */
    setPointer(x: number | null, y = 0) {
      pointer = x === null ? null : { x: x / scale, y: y / scale };
    },
    run() {
      // Primeiro quadro já, sem esperar o loop: nunca fica um vazio.
      draw();
      needsDraw = false;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(frame);
    },
  };
}
