"use client";

import { Moon, Sun } from "lucide-react";

import { DEFAULT_APPEARANCE } from "@/lib/theme/appearance";
import { applyAppearance, readAppearance } from "@/lib/theme/apply-appearance";
import { useResolvedMode } from "@/lib/theme/mode";
import { cn } from "@/lib/utils";

/**
 * Alterna entre claro e escuro nas páginas públicas. Grava a mesma preferência de Configurações (cookie `ui_mode`,
 * `data-mode` no <html>), então o ERP abre no mesmo modo escolhido aqui e vice-versa.
 */
export function ModeToggle({ className }: { className?: string }) {
  const mode = useResolvedMode();
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => applyAppearance({ ...readAppearance(DEFAULT_APPEARANCE), mode: next })}
      aria-label={next === "dark" ? "Usar tema escuro" : "Usar tema claro"}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sharp text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60",
        className,
      )}
    >
      {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
