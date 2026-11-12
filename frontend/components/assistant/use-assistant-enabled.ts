import { useSyncExternalStore } from "react";

const STORAGE_KEY = "assistant-enabled";
const CHANGE_EVENT = `${STORAGE_KEY}:change`;

/**
 * Se o assistente de ajuda aparece na tela (ligado por padrão), lembrando a escolha neste navegador (o storage pode estar
 * indisponível: então fica ligado). Até o cliente assumir vale desligado, para quem o desligou não ver o botão piscar; quem o
 * mantém ligado o vê aparecer logo após a página carregar.
 */
export function useAssistantEnabled() {
  const enabled = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY) !== "0";
      } catch {
        return true;
      }
    },
    () => false,
  );

  const setEnabled = (next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return [enabled, setEnabled] as const;
}
