import { APPEARANCE_COOKIES, type Appearance } from "@/lib/appearance";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Aplica no <html> (efeito imediato) e grava em cookie (o servidor renderiza já com o tema). */
export function applyAppearance(next: Appearance) {
  const root = document.documentElement;
  root.dataset.accent = next.accent;
  root.dataset.font = next.font;
  for (const key of ["accent", "font"] as const) {
    document.cookie = `${APPEARANCE_COOKIES[key]}=${next[key]}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
}

/** Lê o tema aplicado no <html> (fonte da verdade depois de qualquer mudança). */
export function readAppearance(fallback: Appearance): Appearance {
  const { accent, font } = document.documentElement.dataset;
  return {
    accent: (accent as Appearance["accent"]) ?? fallback.accent,
    font: (font as Appearance["font"]) ?? fallback.font,
  };
}
