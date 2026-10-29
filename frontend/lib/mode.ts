import { useSyncExternalStore } from "react";

export type ResolvedMode = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** O modo que está valendo na tela: `data-mode` do <html> (claro, escuro ou sistema), com o sistema resolvido pelo SO. */
export function resolveMode(): ResolvedMode {
  const mode = document.documentElement.dataset.mode;
  if (mode === "system") return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  return mode === "light" ? "light" : "dark";
}

/** Avisa quando o modo muda: troca em Configurações ou no botão das páginas públicas, ou o SO no modo sistema. */
export function subscribeMode(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** O modo em uso, atualizado quando muda. No servidor e na hidratação vale `light`, para não divergir do HTML. */
export function useResolvedMode(): ResolvedMode {
  return useSyncExternalStore(subscribeMode, resolveMode, () => "light");
}
