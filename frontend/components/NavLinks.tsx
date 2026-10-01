"use client";

import { Building2, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/condominios", label: "Condomínios", icon: Building2 },
  { href: "/pessoas", label: "Pessoas", icon: Users },
];

/**
 * Client Component: precisa do pathname para marcar o item ativo.
 * Dentro de `<aside data-collapsed>` (lg+): recolhida = só ícone, aberta = só texto.
 * Abaixo de `lg` é uma faixa horizontal com os textos.
 */
export function NavLinks() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
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
