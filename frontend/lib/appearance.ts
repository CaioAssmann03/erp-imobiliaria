/**
 * Preferências de aparência (Configurações). Cada preferência vira um atributo no <html>
 * (`data-mode`, `data-accent`, `data-font`) que o CSS (app/globals.css) usa para trocar
 * as variáveis do tema. Ficam em cookie para o servidor renderizar já com o tema certo.
 */

export const MODES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

export const ACCENTS = [
  { value: "orange", label: "Laranja", color: "#f05a28" },
  { value: "blue", label: "Azul", color: "#2f6bff" },
  { value: "green", label: "Verde", color: "#1f9d6b" },
  { value: "violet", label: "Violeta", color: "#7a4dff" },
  { value: "red", label: "Vermelho", color: "#e0243c" },
  { value: "rose", label: "Rosa", color: "#e5457a" },
  { value: "graphite", label: "Grafite", color: "#3a3a38" },
] as const;

export const FONTS = [
  { value: "inter", label: "Inter", hint: "Padrão", family: "var(--font-inter), sans-serif" },
  { value: "dm-sans", label: "DM Sans", hint: "Moderna", family: "var(--font-dm-sans), sans-serif" },
  { value: "serif", label: "Source Serif", hint: "Clássica", family: "var(--font-source-serif), serif" },
  { value: "system", label: "Sistema", hint: "Fonte do dispositivo", family: "system-ui, sans-serif" },
] as const;

export type Mode = (typeof MODES)[number]["value"];
export type Accent = (typeof ACCENTS)[number]["value"];
export type Font = (typeof FONTS)[number]["value"];

export interface Appearance {
  mode: Mode;
  accent: Accent;
  font: Font;
}

export const DEFAULT_APPEARANCE: Appearance = { mode: "dark", accent: "orange", font: "inter" };

export const APPEARANCE_COOKIES = {
  mode: "ui_mode",
  accent: "ui_accent",
  font: "ui_font",
} as const;

const pick = <T extends { value: string }>(options: readonly T[], value: string | undefined) =>
  options.find((option) => option.value === value)?.value as T["value"] | undefined;

/** Valida valores vindos de cookie (podem estar ausentes ou adulterados). */
export function parseAppearance(
  get: (name: string) => string | undefined
): Appearance {
  return {
    mode: pick(MODES, get(APPEARANCE_COOKIES.mode)) ?? DEFAULT_APPEARANCE.mode,
    accent: pick(ACCENTS, get(APPEARANCE_COOKIES.accent)) ?? DEFAULT_APPEARANCE.accent,
    font: pick(FONTS, get(APPEARANCE_COOKIES.font)) ?? DEFAULT_APPEARANCE.font,
  };
}
