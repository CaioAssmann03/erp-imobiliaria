import {
  APPEARANCE_COOKIES,
  CUSTOM_ACCENT,
  customAccentForeground,
  isHexColor,
  type Appearance,
} from "@/lib/theme/appearance";

const ONE_YEAR = 60 * 60 * 24 * 365;
const KEYS = ["mode", "accent", "accentCustom", "font", "text", "motion"] as const;

/** Aplica no <html> (efeito imediato) e grava em cookie (o servidor renderiza já com o tema). */
export function applyAppearance(next: Appearance) {
  const root = document.documentElement;
  for (const key of KEYS) {
    root.dataset[key] = next[key];
    document.cookie = `${APPEARANCE_COOKIES[key]}=${next[key]}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
  // O destaque personalizado entra por duas variáveis do <html>; o CSS deriva as variações dele (`html[data-accent="custom"]`).
  if (next.accent === CUSTOM_ACCENT && isHexColor(next.accentCustom)) {
    root.style.setProperty("--accent-custom", next.accentCustom);
    root.style.setProperty("--accent-foreground", customAccentForeground(next.accentCustom));
  } else {
    root.style.removeProperty("--accent-custom");
    root.style.removeProperty("--accent-foreground");
  }
}

/** Lê o tema aplicado no <html> (fonte da verdade depois de qualquer mudança). */
export function readAppearance(fallback: Appearance): Appearance {
  const { dataset } = document.documentElement;
  const read = <K extends (typeof KEYS)[number]>(key: K) => (dataset[key] as Appearance[K] | undefined) ?? fallback[key];
  return {
    mode: read("mode"),
    accent: read("accent"),
    accentCustom: read("accentCustom"),
    font: read("font"),
    text: read("text"),
    motion: read("motion"),
  };
}
