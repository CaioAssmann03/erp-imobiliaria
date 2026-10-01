"use client";

import { Building2, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/condominios", label: "Condomínios", icon: Building2 },
  { href: "/pessoas", label: "Pessoas", icon: Users },
];

/** Client Component: navegação em abas fixa na parte de baixo, só em telas pequenas. */
export function MobileTabs() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgb(0_0_0/0.06)] backdrop-blur-md lg:hidden"
    >
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(tab.href) ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors",
            isActive(tab.href) ? "font-semibold text-ink" : "text-ink-soft"
          )}
        >
          <tab.icon className="size-5" />
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
