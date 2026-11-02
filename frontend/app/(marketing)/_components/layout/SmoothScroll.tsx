"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { isLite } from "@/lib/theme/use-lite";

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (isLite()) return;

    const lenis = new Lenis({ lerp: 0.09, anchors: true });
    lenisRef.current = lenis;
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    // O Lenis só observa o `html`, que aqui tem a altura da tela: quando a página cresce depois de montada (a navegação entre
    // páginas públicas, imagens e fontes que chegam) o limite medido fica velho e a rolagem trava antes do fim. Quem muda de
    // altura é o `body`, então é ele que se observa para medir de novo.
    const resize = new ResizeObserver(() => lenis.resize());
    resize.observe(document.body);

    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // O layout é compartilhado entre as páginas públicas: ao trocar de página (por exemplo, o fim de Lançamentos para
  // Cobranças) o Next pode manter a rolagem de onde o leitor estava. Nova página abre sempre no topo.
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    if (window.location.hash) return;
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
