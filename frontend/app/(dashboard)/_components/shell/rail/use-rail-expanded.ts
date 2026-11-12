import { useSyncExternalStore } from "react";

const STORAGE_KEY = "rail-expanded";
const CHANGE_EVENT = `${STORAGE_KEY}:change`;

/**
 * Se a rail da lateral está expandida (ícones com nome) ou recolhida (só ícones, o padrão), lembrando a escolha neste
 * navegador (o storage pode estar indisponível). Até o cliente assumir vale o recolhido, o mesmo HTML para todos.
 */
export function useRailExpanded() {
  const expanded = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, expanded ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return [expanded, toggle] as const;
}
