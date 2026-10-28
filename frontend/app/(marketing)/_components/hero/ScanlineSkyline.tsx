"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { PAD, PARALLAX_BACK, PARALLAX_FRONT, renderLayers, type SkylineColors, type SkylineLayers } from "./skyline-layers";
import { buildDrip, drawDrip, type SkylineDrip } from "./skyline-drip";
import { buildSkyline, type SkylineScene } from "./skyline-scene";

const RISE_MS = 1600;
/** Densidade máxima de pixels: acima disso o custo cresce sem ganho visível nas linhas. */
const MAX_RATIO = 1.5;
/** Fração das janelas acesas pelo automático (poucas: o círculo do mouse precisa se destacar), trocas por segundo e raio da luz do mouse. */
const LIT_RATIO = 0.08;
const TOGGLES_PER_SECOND = 10;
const LIGHT_RADIUS = 170;
/** Suavização por segundo (fração percorrida até o alvo): janelas e parallax. */
const WINDOW_EASE = 0.98;
const PARALLAX_EASE = 0.85;
const MELT_EASE = 0.95;
/** Altura do chão na tela (fração da viewport, abaixo do cabeçalho) em que o derretimento começa. */
const MELT_START = 0.08;

/** Cores lidas dos tokens do tema (nada de cor fixa): três tons do destaque, janela apagada (tinta) e acesa (branco). */
function palette(element: HTMLElement): SkylineColors {
  const style = getComputedStyle(element);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    tones: [token("--color-brand-light"), token("--color-brand"), token("--color-brand-strong")],
    ink: token("--color-ink"),
    light: token("--color-surface"),
  };
}

/**
 * Client Component: skyline de prédios laranja em linhas horizontais num <canvas>. As partes fixas são
 * pré-renderizadas (`skyline-layers.ts`); cada quadro cola as camadas e desenha só as janelas apagadas.
 * Os prédios sobem ao carregar, as janelas acendem e apagam sozinhas, o mouse ilumina as janelas por
 * perto e desloca as camadas (parallax). Num segundo canvas logo abaixo do chão (`dripClassName`), a base escorre em
 * pixels (`skyline-drip.ts`): o derretimento só começa quando o chão sai pelo topo da tela (prédios fora de vista) e
 * termina quando a rolagem percorre um terço da altura da faixa; esse canvas só redesenha quando algo muda.
 * Parado (e já escorrido) para quem prefere menos movimento.
 */
export function ScanlineSkyline({ className, dripClassName }: { className?: string; dripClassName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dripRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const dripCanvas = dripRef.current;
    const dripContext = dripCanvas?.getContext("2d");
    if (!canvas || !context || !dripCanvas || !dripContext) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = palette(canvas);
    let scene: SkylineScene = buildSkyline(0, 0);
    let layers: SkylineLayers | null = null;
    let drip: SkylineDrip | null = null;
    let lit: number[] = []; // 0 = apagada, 1 = acesa (automático); interpolado até `litTarget`
    let litTarget: number[] = [];
    let width = 0;
    let height = 0;
    let dripHeight = 0;
    let melted = reduceMotion ? 1 : 0;
    let drawn = { melt: -1, parallax: 0 }; // último quadro da faixa: só redesenha quando muda
    let animation = 0;
    let last = 0;
    let startedAt = 0;
    let visible = true;
    let dripVisible = false;
    const pointer = { x: -9999, y: -9999, parallax: 0, parallaxTarget: 0 };

    const draw = (rise: number) => {
      if (!layers) return;
      context.clearRect(0, 0, width, height);
      const offset = (1 - rise) * height * 0.6;
      const front = pointer.parallax * PARALLAX_FRONT;
      context.drawImage(layers.back, -PAD + pointer.parallax * PARALLAX_BACK, offset * 1.2, width + PAD * 2, height);
      context.drawImage(layers.front, -PAD + front, offset, width + PAD * 2, height);

      // Janelas acesas por cima das apagadas (que já estão na camada): o mouse acende um círculo; o automático, algumas soltas.
      context.fillStyle = colors.light;
      scene.windows.forEach((window, index) => {
        const x = window.x + front;
        const y = window.y + offset;
        // Branco cheio até metade do raio; depois esmaece até a borda (smoothstep), sem um mar de cinzas.
        const reach = Math.min(1, 2 * Math.max(0, 1 - Math.hypot(x + window.w / 2 - pointer.x, y + window.h / 2 - pointer.y) / LIGHT_RADIUS));
        const alpha = Math.max(reach * reach * (3 - 2 * reach), lit[index]);
        if (alpha < 0.02) return;
        context.globalAlpha = alpha;
        context.fillRect(x, y, window.w, window.h);
      });
      context.globalAlpha = 1;
      context.globalCompositeOperation = "destination-out";
      context.drawImage(layers.stripes, -PAD, 0, width + PAD * 2, height);
      context.globalCompositeOperation = "source-over";
    };

    const drawDripFrame = () => {
      if (!drip) return;
      const parallax = pointer.parallax * PARALLAX_FRONT;
      drawn = { melt: melted, parallax };
      dripContext.clearRect(0, 0, width, dripHeight);
      drawDrip(dripContext, drip, melted, parallax);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
      width = rect.width;
      height = Math.floor(rect.height); // chão em pixel inteiro: linhas e janelas nítidas
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      scene = buildSkyline(width, height);
      layers = renderLayers(scene, width, height, ratio, colors);
      dripHeight = Math.floor(dripCanvas.getBoundingClientRect().height);
      dripCanvas.width = Math.round(width * ratio);
      dripCanvas.height = Math.round(dripHeight * ratio);
      dripContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      drip = buildDrip(scene, width, height, dripHeight, ratio, colors);
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
      // Automático: troca uma janela de estado, mantendo a fração acesa por volta de LIT_RATIO.
      if (litTarget.length && Math.random() < TOGGLES_PER_SECOND * seconds) {
        const index = Math.floor(Math.random() * litTarget.length);
        litTarget[index] = litTarget[index] ? 0 : Math.random() < LIT_RATIO / (1 - LIT_RATIO) ? 1 : 0; // equilíbrio em LIT_RATIO
      }
      const windowStep = ease(WINDOW_EASE, seconds);
      for (let index = 0; index < lit.length; index++) lit[index] += (litTarget[index] - lit[index]) * windowStep;
      pointer.parallax += (pointer.parallaxTarget - pointer.parallax) * ease(PARALLAX_EASE, seconds);
      if (dripVisible) {
        // 0 enquanto o chão está na tela (abaixo do cabeçalho); depois, os fios descem mais rápido que a rolagem e
        // terminam quando ela percorre um terço da faixa, então as pontas avançam pela tela em vez de ficarem no topo.
        const top = dripCanvas.getBoundingClientRect().top - window.innerHeight * MELT_START;
        const meltTarget = Math.min(1, Math.max(0, -top / (dripHeight / 3)));
        melted += (meltTarget - melted) * ease(MELT_EASE, seconds);
        const parallax = pointer.parallax * PARALLAX_FRONT;
        if (Math.abs(melted - drawn.melt) > 0.001 || Math.abs(parallax - drawn.parallax) > 0.05) drawDripFrame();
      }
      if (!visible) return;
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
      draw(reduceMotion || (startedAt && performance.now() - startedAt > RISE_MS) ? 1 : 0);
      drawDripFrame();
    });
    // Fora da tela, o loop continua mas não desenha.
    const visibility = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) visible = entry.isIntersecting;
        else dripVisible = entry.isIntersecting;
      }
    });

    // Começa depois que a página assenta (hidratação, fontes), para não disputar o primeiro quadro.
    const start = () => {
      resize();
      resizeObserver.observe(canvas);
      visibility.observe(canvas);
      visibility.observe(dripCanvas);
      if (reduceMotion) return draw(1);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      startedAt = performance.now();
      last = startedAt;
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
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className={cn("block", className)} />
      <canvas ref={dripRef} aria-hidden className={cn("pointer-events-none block", dripClassName)} />
    </>
  );
}
