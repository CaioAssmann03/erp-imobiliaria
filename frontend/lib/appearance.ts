/**
 * Preferências de aparência (Configurações). Cada preferência vira um atributo no <html>
 * (`data-accent`, `data-font`) que o CSS (app/globals.css) usa para trocar
 * as variáveis do tema (o tema é um só, claro). Ficam em cookie; o script `APPEARANCE_INIT_SCRIPT` os aplica no <html> antes do
 * primeiro paint (o servidor não lê cookie: a página é a mesma para todos).
 */

import { SIDEBAR_COOKIE } from "@/lib/auth";

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

export type Accent = (typeof ACCENTS)[number]["value"];
export type Font = (typeof FONTS)[number]["value"];

export interface Appearance {
  accent: Accent;
  font: Font;
}

export const DEFAULT_APPEARANCE: Appearance = { accent: "orange", font: "inter" };

export const APPEARANCE_COOKIES = {
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
    accent: pick(ACCENTS, get(APPEARANCE_COOKIES.accent)) ?? DEFAULT_APPEARANCE.accent,
    font: pick(FONTS, get(APPEARANCE_COOKIES.font)) ?? DEFAULT_APPEARANCE.font,
  };
}

/**
 * Script inline do <head>: roda antes do primeiro paint e copia os cookies de aparência e da lateral para
 * atributos do <html> (`data-accent`, `data-font`, `data-sidebar`), sem piscar o tema padrão.
 * Valores fora da lista (cookie adulterado) caem no padrão.
 */
export const APPEARANCE_INIT_SCRIPT = `(function(){try{
var c={};document.cookie.split("; ").forEach(function(r){var i=r.indexOf("=");if(i>0)c[r.slice(0,i)]=decodeURIComponent(r.slice(i+1))});
var d=document.documentElement.dataset;
function pick(v,o,f){return o.indexOf(v)>-1?v:f}
d.accent=pick(c[${JSON.stringify(APPEARANCE_COOKIES.accent)}],${JSON.stringify(ACCENTS.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.accent)});
d.font=pick(c[${JSON.stringify(APPEARANCE_COOKIES.font)}],${JSON.stringify(FONTS.map((o) => o.value))},${JSON.stringify(DEFAULT_APPEARANCE.font)});
d.sidebar=c[${JSON.stringify(SIDEBAR_COOKIE)}]==="0"?"closed":"open";
}catch(e){}})();`;
