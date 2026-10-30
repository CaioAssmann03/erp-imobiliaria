"use client";

import { useEffect, useRef } from "react";

import { brandRamp } from "@/lib/theme/brand-ramp";
import { cn } from "@/lib/utils";

import { LINE, PAD, PARALLAX_BACK, PARALLAX_FRONT, PITCH, renderLayers, type SkylineColors, type SkylineLayers } from "./skyline-layers";
import { buildSkyline, type SkylineScene } from "./skyline-scene";

const RISE_MS = 1600;
/** Densidade máxima de pixels: acima disso o custo cresce sem ganho visível nas linhas. */
const MAX_RATIO = 1.5;
/** Fração das janelas acesas pelo automático (poucas: o círculo do mouse precisa se destacar), trocas por segundo e raio da luz do mouse. */
const LIT_RATIO = 0.15;
const TOGGLES_PER_SECOND = 24;
const LIGHT_RADIUS = 170;
const LIGHT_RADIUS_SQUARED = LIGHT_RADIUS * LIGHT_RADIUS;
/** Suavização por segundo (fração percorrida até o alvo): janelas e parallax. */
const WINDOW_EASE = 0.98;
const PARALLAX_EASE = 0.85;
/** Cores lidas dos tokens do tema (nada de cor fixa): três tons da mesma rampa dos prédios do login, janela apagada (tinta) e acesa (branco). */
function palette(element: HTMLElement): SkylineColors {
  const style = getComputedStyle(element);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const ramp = brandRamp(element);
  return {
    tones: [ramp(0.72), ramp(0.55), ramp(0.3)],
    ink: token("--color-window-off"),
    light: token("--color-window-on"),
  };
}

/**
 * Client Component: skyline de prédios laranja em linhas horizontais num <canvas>. As partes fixas são
 * pré-renderizadas (`skyline-layers.ts`); cada quadro cola as camadas e desenha só as janelas apagadas.
 * Os prédios sobem ao carregar, as janelas acendem e apagam sozinhas, o mouse ilumina as janelas por
 * perto e desloca as camadas (parallax). Para de desenhar quando a seção seguinte já cobriu o hero.
 * Parado para quem prefere menos movimento.
 */
export function ScanlineSkyline({ className, variant = "hero" }: { className?: string; variant?: "hero" | "footer" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // No fecho da página os prédios têm outra silhueta (colina) e sobem quando chegam à tela, não ao carregar.
    const closing = variant === "footer";
    const shape = closing ? "hill" : "valley";
    const colors = palette(canvas);
    let scene: SkylineScene = buildSkyline(0, 0, shape);
    let layers: SkylineLayers | null = null;
    let lit: number[] = []; // 0 = apagada, 1 = acesa (automático); interpolado até `litTarget`
    let litTarget: number[] = [];
    let width = 0;
    let height = 0;
    let animation = 0;
    let last = 0;
    let startedAt = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999, parallax: 0, parallaxTarget: 0 };

    const draw = (rise: number) => {
      if (!layers) return;
      context.clearRect(0, 0, width, height);
      const offset = (1 - rise) * height * 0.6;
      const front = pointer.parallax * PARALLAX_FRONT;
      context.drawImage(layers.back, -PAD + pointer.parallax * PARALLAX_BACK, offset * 1.2, width + PAD * 2, height);
      context.drawImage(layers.front, -PAD + front, offset, width + PAD * 2, height);

      // Janelas acesas por cima das apagadas (que já estão na camada): o mouse acende um círculo; o automático, algumas soltas.
      // Com os prédios no lugar (`rise` = 1) as janelas caem exatamente na grade da persiana, então cada uma já é desenhada em
      // linhas separadas; só durante a subida, com tudo deslocado, a persiana passa por cima (uma mescla de tela inteira por quadro).
      const settled = rise >= 1;
      const windows = scene.windows;
      context.fillStyle = colors.light;
      for (let index = 0; index < windows.length; index++) {
        const pane = windows[index];
        const x = pane.x + front;
        const y = pane.y + offset;
        let alpha = lit[index];
        const dx = x + pane.w / 2 - pointer.x;
        const dy = y + pane.h / 2 - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < LIGHT_RADIUS_SQUARED) {
          // Branco cheio até metade do raio; depois esmaece até a borda (smoothstep), sem um mar de cinzas.
          const reach = Math.min(1, 2 * (1 - Math.sqrt(distanceSquared) / LIGHT_RADIUS));
          alpha = Math.max(reach * reach * (3 - 2 * reach), alpha);
        }
        if (alpha < 0.02) continue;
        context.globalAlpha = alpha;
        if (settled) {
          for (let row = 0; row < pane.h; row += PITCH) context.fillRect(x, y + row + PITCH - LINE, pane.w, LINE);
        } else {
          context.fillRect(x, y, pane.w, pane.h);
        }
      }
      context.globalAlpha = 1;
      if (!settled) {
        context.globalCompositeOperation = "destination-out";
        context.drawImage(layers.stripes, -PAD, 0, width + PAD * 2, height);
        context.globalCompositeOperation = "source-over";
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      width = rect.width;
      height = Math.floor(rect.height); // chão em pixel inteiro: linhas e janelas nítidas
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      scene = buildSkyline(width, height, shape);
      layers = renderLayers(scene, width, height, ratio, colors);
      litTarget = scene.windows.map((_, index) => (((index * 37) % 100) / 100 < LIT_RATIO ? 1 : 0));
      lit = [...litTarget];
    };

    /** Fração do caminho até o alvo percorrida em `seconds`, dada a fração percorrida por segundo. */
    const ease = (perSecond: number, seconds: number) => 1 - Math.pow(1 - perSecond, seconds);

    // Na taxa da tela (60/120 Hz): tudo depende do tempo decorrido, não do número de quadros.
    const tick = (now: number) => {
      animation = requestAnimationFrame(tick);
      const seconds = Math.min((now - last) / 1000, 0.1);
      last = now;
      // O hero fica fixo enquanto a seção seguinte sobe por cima; fora da tela ou coberto, não há o que atualizar nem desenhar.
      if (!visible || !startedAt || (!closing && window.scrollY > window.innerHeight)) return;
      // Automático: troca uma janela de estado, mantendo a fração acesa por volta de LIT_RATIO.
      if (litTarget.length && Math.random() < TOGGLES_PER_SECOND * seconds) {
        const index = Math.floor(Math.random() * litTarget.length);
        litTarget[index] = litTarget[index] ? 0 : Math.random() < LIT_RATIO / (1 - LIT_RATIO) ? 1 : 0; // equilíbrio em LIT_RATIO
      }
      const windowStep = ease(WINDOW_EASE, seconds);
      for (let index = 0; index < lit.length; index++) lit[index] += (litTarget[index] - lit[index]) * windowStep;
      pointer.parallax += (pointer.parallaxTarget - pointer.parallax) * ease(PARALLAX_EASE, seconds);
      const t = Math.min((now - startedAt) / RISE_MS, 1);
      draw(1 - Math.pow(1 - t, 3));
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.parallaxTarget = event.clientX / window.innerWidth - 0.5;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (closing && !startedAt && !reduceMotion) return; // ainda não chegou à tela: nada aparece antes de subir
      draw(reduceMotion || (startedAt && performance.now() - startedAt > RISE_MS) ? 1 : 0);
    });
    // Fora da tela, o loop continua mas não desenha.
    const visibility = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
          if (closing && visible && !startedAt) startedAt = performance.now(); // a subida começa quando aparece
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    // Começa depois que a página assenta (hidratação, fontes), para não disputar o primeiro quadro.
    const start = () => {
      resize();
      resizeObserver.observe(canvas);
      visibility.observe(canvas);
      if (reduceMotion) return draw(1);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      startedAt = closing ? 0 : performance.now();
      last = performance.now();
      animation = requestAnimationFrame(tick);
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 400 }) ?? window.setTimeout(start, 150);

    return () => {
      window.cancelIdleCallback?.(idle);
      window.clearTimeout(idle);
      resizeObserver.disconnect();
      visibility.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(animation);
    };
  }, [variant]);

  return <canvas ref={canvasRef} aria-hidden className={cn("block", className)} />;
}
