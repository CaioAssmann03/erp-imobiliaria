"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";

/**
 * Client Component: precisa do pathname para marcar o item ativo.
 * Dentro de `<aside data-collapsed>`: recolhida = só ícone, aberta = ícone e texto.
 * Só desktop (no celular a navegação é o `MobileMenu`).
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "flex h-9 items-center gap-3 rounded-control px-3 text-body font-medium whitespace-nowrap transition-colors lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0",
              isNavItemActive(item.href, pathname)
                ? "bg-ink text-ink-foreground"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            )}
          >
            <item.icon className="size-[1.125rem] shrink-0" />
            <span className="lg:group-data-[collapsed]/sidebar:hidden">{item.label}</span>
          </Link>
      ))}
    </nav>
  );
}
