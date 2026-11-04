import { useSyncExternalStore } from "react";

/**
 * Se a janela do assistente está aberta. Fica fora do componente para que mais de um lugar a abra: o botão "Ajuda" do desktop
 * (`AssistantChat`) e a linha "Ajuda" do menu lateral do celular (`MobileMenu`). No servidor vale fechada.
 */
let isOpen = false;
const listeners = new Set<() => void>();

function setOpen(next: boolean) {
  if (isOpen === next) return;
  isOpen = next;
  listeners.forEach((listener) => listener());
}

export function useAssistantOpen() {
  const open = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => isOpen,
    () => false,
  );
  return [open, setOpen] as const;
}
