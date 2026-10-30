/**
 * Preferências de aparência (Configurações). Cada preferência vira um atributo no <html>
 * (`data-mode`, `data-accent`, `data-font`, `data-text`, `data-motion`) que o CSS (app/globals.css) usa para trocar
 * as variáveis do tema. Ficam em cookie; o script `APPEARANCE_INIT_SCRIPT` os aplica no <html> antes do
 * primeiro paint (o servidor não lê cookie: a página é a mesma para todos).
 */


export const MODES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

export const ACCENTS = [{ value: "orange", label: "Laranja", color: "#f05a28" }] as const;

/** O valor de `accent` quando a cor é a escolhida no seletor livre (`accentCustom`, um #rrggbb). */
export const CUSTOM_ACCENT = "custom";
const ACCENT_VALUES: readonly string[] = [...ACCENTS.map((option) => option.value), CUSTOM_ACCENT];

export const isHexColor = (value: string | undefined): value is string => /^#[0-9a-fA-F]{6}$/.test(value ?? "");

/** Cor do texto sobre o destaque personalizado: escura em cores claras, branca nas demais. */
export function customAccentForeground(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const luminance = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return luminance > 0.62 ? "#1c1b19" : "#ffffff";
}

export const FONTS = [
  { value: "inter", label: "Inter", hint: "Padrão", family: "var(--font-inter), sans-serif" },
  { value: "dm-sans", label: "DM Sans", hint: "Moderna", family: "var(--font-dm-sans), sans-serif" },
  { value: "serif", label: "Source Serif", hint: "Clássica", family: "var(--font-source-serif), serif" },
  { value: "system", label: "Sistema", hint: "Fonte do dispositivo", family: "system-ui, sans-serif" },
] as const;

export const TEXT_SIZES = [
  { value: "normal", label: "Padrão", hint: "100%" },
  { value: "large", label: "Grande", hint: "112%" },
  { value: "xlarge", label: "Maior", hint: "125%" },
] as const;

export const MOTIONS = [
  { value: "full", label: "Normal" },
  { value: "reduced", label: "Reduzidas" },
] as const;

export type Mode = (typeof MODES)[number]["value"];
export type Accent = (typeof ACCENTS)[number]["value"] | typeof CUSTOM_ACCENT;
export type Font = (typeof FONTS)[number]["value"];
export type TextSize = (typeof TEXT_SIZES)[number]["value"];
export type Motion = (typeof MOTIONS)[number]["value"];

export interface Appearance {
  mode: Mode;
  accent: Accent;
  /** O #rrggbb do destaque personalizado (só vale com `accent: "custom"`); vazio se nunca escolhido. */
  accentCustom: string;
  font: Font;
  text: TextSize;
  motion: Motion;
}

export const DEFAULT_APPEARANCE: Appearance = { mode: "dark", accent: "orange", accentCustom: "", font: "inter", text: "normal", motion: "full" };

export const APPEARANCE_COOKIES = {
  mode: "ui_mode",
  accent: "ui_accent",
  accentCustom: "ui_accent_custom",
  font: "ui_font",
  text: "ui_text",
  motion: "ui_motion",
} as const;

const pick = <T extends { value: string }>(options: readonly T[], value: string | undefined) =>
  options.find((option) => option.value === value)?.value as T["value"] | undefined;

/** Valida valores vindos de cookie (podem estar ausentes ou adulterados). */
export function parseAppearance(
  get: (name: string) => string | undefined
): Appearance {
  const custom = get(APPEARANCE_COOKIES.accentCustom);
  const accentCustom = isHexColor(custom) ? custom : "";
  const accent = pick(ACCENT_VALUES.map((value) => ({ value })), get(APPEARANCE_COOKIES.accent)) as Accent | undefined;
  return {
    mode: pick(MODES, get(APPEARANCE_COOKIES.mode)) ?? DEFAULT_APPEARANCE.mode,
    accent: accent === CUSTOM_ACCENT && !accentCustom ? DEFAULT_APPEARANCE.accent : (accent ?? DEFAULT_APPEARANCE.accent),
    accentCustom,
    font: pick(FONTS, get(APPEARANCE_COOKIES.font)) ?? DEFAULT_APPEARANCE.font,
    text: pick(TEXT_SIZES, get(APPEARANCE_COOKIES.text)) ?? DEFAULT_APPEARANCE.text,
    motion: pick(MOTIONS, get(APPEARANCE_COOKIES.motion)) ?? DEFAULT_APPEARANCE.motion,
  };
}

/**
 * Script inline do <head>: roda antes do primeiro paint e copia os cookies de aparência para
 * atributos do <html> (`data-mode`, `data-accent`, `data-font`, `data-text`, `data-motion`), sem piscar o tema padrão.
 * Valores fora da lista (cookie adulterado) caem no padrão.
 */
export const APPEARANCE_INIT_SCRIPT = `(function(){try{
var c={};document.cookie.split("; ").forEach(function(r){var i=r.indexOf("=");if(i>0)c[r.slice(0,i)]=decodeURIComponent(r.slice(i+1))});
var d=document.documentElement.dataset;
function pick(v,o,f){return o.indexOf(v)>-1?v:f}
d.mode=pick(c[${JSON.stringify(APPEARANCE_COOKIES.mode)}],${JSON.stringify(MODES.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.mode)});
var h=c[${JSON.stringify(APPEARANCE_COOKIES.accentCustom)}],ok=/^#[0-9a-fA-F]{6}$/.test(h||""),s=document.documentElement.style;
d.accentCustom=ok?h:"";
d.accent=pick(c[${JSON.stringify(APPEARANCE_COOKIES.accent)}],${JSON.stringify(ACCENT_VALUES)},${JSON.stringify(DEFAULT_APPEARANCE.accent)});
if(d.accent===${JSON.stringify(CUSTOM_ACCENT)}){if(ok){var n=parseInt(h.slice(1),16);s.setProperty("--accent-custom",h);s.setProperty("--accent-foreground",(0.2126*(n>>16&255)+0.7152*(n>>8&255)+0.0722*(n&255))/255>0.62?"#1c1b19":"#ffffff")}else d.accent=${JSON.stringify(DEFAULT_APPEARANCE.accent)}}
d.font=pick(c[${JSON.stringify(APPEARANCE_COOKIES.font)}],${JSON.stringify(FONTS.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.font)});
d.text=pick(c[${JSON.stringify(APPEARANCE_COOKIES.text)}],${JSON.stringify(TEXT_SIZES.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.text)});
d.motion=pick(c[${JSON.stringify(APPEARANCE_COOKIES.motion)}],${JSON.stringify(MOTIONS.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.motion)});
}catch(e){}})();`;
