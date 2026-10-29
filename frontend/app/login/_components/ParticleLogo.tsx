"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { buildParticles, COMPACT_STEP, STEP } from "./logo/particles";
import { SCENE } from "./logo/scene";
import { createSimulation } from "./logo/simulation";

/** A partir daqui a página mostra o painel ao lado do formulário (logo grande); abaixo, o logo pequeno acima do título. */
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeToDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Client Component: o logo da casa do login, em 3D e feito de partículas quadradas em tons de laranja (os tokens de destaque
 * do tema). Se monta ao abrir, algumas faixas acendem e apagam e, no desktop, o mouse acende as faixas de perto (como as janelas
 * da home) e empurra de leve as partículas. Para quem prefere menos movimento fica o desenho parado.
 *
 * Tem duas versões, e só a da tela atual roda (a outra fica parada, sem desenhar): a grande, no painel ao lado do formulário, inteira
 * à vista; e, com `compact`, a do celular, pequena, acima do formulário, com 4 vezes menos partículas e sem reagir ao toque.
 */
export function ParticleLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDesktop = useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
  const active = compact ? !isDesktop : isDesktop;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!active || !wrap || !canvas) return;

    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const simulation = createSimulation(canvas, buildParticles(compact ? COMPACT_STEP : STEP), animate);
    const measure = () => simulation.resize(wrap.clientWidth, wrap.clientHeight);
    measure();
    simulation.readColor();

    const resize = new ResizeObserver(measure);
    resize.observe(wrap);
    // O mouse é lido na janela: o <main> da página (z-10, largura total) cobre o logo, então os eventos nunca chegam a ele.
    // No celular não há mouse: o logo pequeno só se monta e pisca.
    const onMove = (event: PointerEvent) => {
      const box = wrap.getBoundingClientRect();
      simulation.setPointer(event.clientX - box.left, event.clientY - box.top);
    };
    const onLeave = () => simulation.setPointer(null);
    const followPointer = animate && !compact;
    if (followPointer) {
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
  }, [active, compact]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Logo da casa em 3D feito de pequenas partículas laranja"
      className={cn("relative", className)}
      style={{
        height: compact ? "clamp(7rem, 22vh, 9.5rem)" : "min(56vh, 36vw)",
        aspectRatio: `${SCENE.width} / ${SCENE.height}`,
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute" />
    </div>
  );
}
