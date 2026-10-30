"use client";

import { Eye } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export const MENU_WIDTH = 96;

interface WidgetViewMenuProps {
  x: number;
  y: number;
  onView: () => void;
  onClose: () => void;
}

/**
 * Opção flutuante de vidro com "Ver", logo abaixo do cursor. Clicar fora, rolar, redimensionar
 * a janela ou apertar Esc fecha.
 */
export function WidgetViewMenu({ x, y, onView, onClose }: WidgetViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ left: x, top: y, width: MENU_WIDTH }}
      className="glass fixed z-50 rounded-panel p-1 animate-in fade-in-0 zoom-in-95"
    >
      <button
        type="button"
        role="menuitem"
        autoFocus
        onClick={onView}
        className="flex h-8 w-full items-center gap-2 rounded-control px-3 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-ink/[0.07] focus-visible:bg-ink/[0.07]"
      >
        <Eye className="size-4 shrink-0 text-ink-soft" />
        Ver
      </button>
    </div>,
    document.body
  );
}
