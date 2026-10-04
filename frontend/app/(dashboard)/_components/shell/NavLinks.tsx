"use client";

import { Building2, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/condominiums", label: "Condomínios", icon: Building2 },
  { href: "/persons", label: "Pessoas", icon: Users },
];

/**
 * Client Component: precisa do pathname para marcar o item ativo.
 * Dentro de `<aside data-collapsed>`: recolhida = só ícone, aberta = só texto.
 * Só desktop (no celular a navegação é o `MobileTabs`).
 */
export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "flex h-9 items-center rounded-control px-3 text-body font-medium whitespace-nowrap transition-colors lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0",
              isActive(item.href)
                ? "bg-ink text-ink-foreground"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            )}
          >
            <item.icon className="hidden size-[1.125rem] lg:group-data-[collapsed]/sidebar:block" />
            <span className="lg:group-data-[collapsed]/sidebar:hidden">{item.label}</span>
          </Link>
      ))}
    </nav>
  );
}
