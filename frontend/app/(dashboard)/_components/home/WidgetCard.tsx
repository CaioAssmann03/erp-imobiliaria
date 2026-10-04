"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 96;

/**
 * Client Component: card do painel. Ao clicar nele (fora de links e botões), aparece uma
 * opção flutuante de vidro logo abaixo do cursor com "Ver", que abre o elemento em destaque
 * (o mesmo efeito de escolhê-lo no Spotlight: `/?foco=<id>`). O card em si não é marcado.
 * Clicar fora, rolar ou apertar Esc fecha a opção.
 */
export function WidgetCard({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const openMenu = (x: number, y: number) =>
    setMenu({
      // Abaixo do cursor, centralizada, sem sair da tela.
      x: Math.min(Math.max(x - MENU_WIDTH / 2, 8), window.innerWidth - MENU_WIDTH - 8),
      y: y + 14,
    });

  const view = () => {
    setMenu(null);
    router.push(`/?foco=${id}`, { scroll: false });
  };

  return (
    <>
      <Card
        id={id}
        tabIndex={0}
        onClick={(event) => {
          // Links, botões e campos dentro do card mantêm o comportamento próprio.
          if ((event.target as HTMLElement).closest("a, button, input, select, textarea")) return;
          openMenu(event.clientX, event.clientY);
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            const box = event.currentTarget.getBoundingClientRect();
            openMenu(box.left + box.width / 2, Math.min(box.bottom, window.innerHeight - 80));
          }
        }}
        className={cn(
          "scroll-mt-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          className
        )}
      >
        {children}
      </Card>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ left: menu.x, top: menu.y, width: MENU_WIDTH }}
            className="glass fixed z-50 rounded-panel p-1 animate-in fade-in-0 zoom-in-95"
          >
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={view}
              className="flex h-8 w-full items-center gap-2 rounded-control px-3 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-ink/[0.07] focus-visible:bg-ink/[0.07]"
            >
              <Eye className="size-4 shrink-0 text-ink-soft" />
              Ver
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
