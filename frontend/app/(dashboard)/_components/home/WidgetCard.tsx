"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MENU_WIDTH, WidgetViewMenu } from "./WidgetViewMenu";

/**
 * Client Component: card do painel. Ao clicar nele (fora de links e botões), aparece uma
 * opção flutuante "Ver", que abre o elemento em destaque (o mesmo efeito de escolhê-lo no
 * Spotlight: `/?focus=<id>`). O card em si não é marcado.
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
  const closeMenu = useCallback(() => setMenu(null), []);

  const openMenu = (x: number, y: number) =>
    setMenu({
      // Abaixo do cursor, centralizada, sem sair da tela.
      x: Math.min(Math.max(x - MENU_WIDTH / 2, 8), window.innerWidth - MENU_WIDTH - 8),
      y: y + 14,
    });

  const view = () => {
    setMenu(null);
    router.push(`/?focus=${id}`, { scroll: false });
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

      {menu && <WidgetViewMenu x={menu.x} y={menu.y} onView={view} onClose={closeMenu} />}
    </>
  );
}
