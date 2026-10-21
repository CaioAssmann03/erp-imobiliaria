"use client";

import { useEffect } from "react";

import { detectApplePlatform } from "@/hooks/use-platform";
import { matchesSearchShortcut } from "@/lib/platform";

/** ⌘K (Mac, iOS) ou Ctrl+K (Windows, Linux) abre e fecha a busca; o atalho do navegador é suprimido. */
export function useSearchShortcut(onToggle: () => void) {
  useEffect(() => {
    const apple = detectApplePlatform();
    const onKeyDown = (event: KeyboardEvent) => {
      if (matchesSearchShortcut(event, apple)) {
        event.preventDefault();
        onToggle();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onToggle]);
}
