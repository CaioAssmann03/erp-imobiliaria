"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { isLite } from "@/lib/theme/use-lite";

export function SmoothScroll() {
  useEffect(() => {
    if (isLite()) return;

    const lenis = new Lenis({ lerp: 0.09, anchors: true });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
