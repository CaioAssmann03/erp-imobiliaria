"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { buildParticles } from "./logo/particles";
import { SCENE } from "./logo/scene";
import { createSimulation } from "./logo/simulation";

/**
 * Client Component: o logo da casa do login, em 3D e feito de partículas quadradas em tons de laranja (os tokens de destaque
 * do tema). Se monta ao abrir, algumas faixas acendem e apagam, o mouse acende as faixas de perto (como as janelas da home) e
 * empurra de leve as partículas. Para quem prefere menos movimento fica o desenho parado. Tem o tamanho dele mesmo: a página
 * o põe num painel ao lado do formulário, inteiro à vista.
 */
export function ParticleLogo({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const simulation = createSimulation(canvas, buildParticles(), animate);
    const measure = () => simulation.resize(wrap.clientWidth, wrap.clientHeight);
    measure();
    simulation.readColor();

    const resize = new ResizeObserver(measure);
    resize.observe(wrap);
    // O mouse é lido na janela: o <main> da página (z-10, largura total) cobre o logo, então os eventos nunca chegam a ele.
    const onMove = (event: PointerEvent) => {
      const box = wrap.getBoundingClientRect();
      simulation.setPointer(event.clientX - box.left, event.clientY - box.top);
    };
    const onLeave = () => simulation.setPointer(null);
    if (animate) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointercancel", onLeave);
    }
    simulation.run();

    return () => {
      simulation.stop();
      resize.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Logo da casa em 3D feito de pequenas partículas laranja"
      className={cn("relative", className)}
      style={{ height: "min(56vh, 36vw)", aspectRatio: `${SCENE.width} / ${SCENE.height}` }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute" />
    </div>
  );
}
