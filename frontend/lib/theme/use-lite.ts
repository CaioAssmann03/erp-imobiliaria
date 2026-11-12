import { useSyncExternalStore } from "react";

/** O modo leve está ligado? (`data-perf` no <html>: ver `resolvePerf` em `appearance.ts`.) Para efeitos que montam dentro de um `useEffect`. */
export function isLite(): boolean {
  return document.documentElement.dataset.perf === "lite";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-perf"] });
  return () => observer.disconnect();
}

/** Igual a `isLite`, mas reativo: troca na hora quando a pessoa muda a preferência. No servidor é falso. */
export function useLite(): boolean {
  return useSyncExternalStore(subscribe, isLite, () => false);
}
