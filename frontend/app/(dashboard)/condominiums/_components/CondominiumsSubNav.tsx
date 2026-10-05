"use client";

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "condominiums-subnav-collapsed";

const CHANGE_EVENT = "condominiums-subnav-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const TABS = [
  { href: "/condominiums", label: "Condomínios" },
  { href: "/condominiums/blocks", label: "Blocos" },
  { href: "/condominiums/units", label: "Unidades" },
  { href: "/condominiums/cost-centers", label: "Sub-contas" },
];

/** Aba de cada URL: `/condominiums/blocks…` → Blocos; `…/units…` (global ou de um condomínio) → Unidades. */
function activeTab(pathname: string | null) {
  if (
    pathname?.startsWith("/condominiums/blocks") ||
    /^\/condominiums\/[^/]+\/blocks/.test(pathname ?? "")
  )
    return "/condominiums/blocks";
  if (
    pathname?.startsWith("/condominiums/units") ||
    /^\/condominiums\/[^/]+\/units/.test(pathname ?? "")
  ) {
    return "/condominiums/units";
  }
  if (pathname?.startsWith("/condominiums/cost-centers"))
    return "/condominiums/cost-centers";
  return "/condominiums";
}

/** Client Component: precisa do pathname para marcar a aba ativa. */
export function CondominiumsSubNav() {
  const current = activeTab(usePathname());
  // Lembra a escolha neste navegador (o storage pode estar indisponível).
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const toggle = () => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  return (
    <nav
      aria-label="Seções de condomínios"
      className={cn(
        "flex items-center gap-1 border-b border-line",
        collapsed ? "mb-3 justify-end" : "mb-6",
      )}
    >
      {!collapsed &&
        TABS.map((tab) => {
          const active = tab.href === current;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-body font-medium transition-colors",
                active
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mostrar abas" : "Recolher abas"}
        title={collapsed ? "Mostrar abas" : "Recolher abas"}
        className="-mb-px ml-auto flex size-8 items-center justify-center rounded-control text-ink-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <ChevronUp
          className={cn(
            "size-4 transition-transform",
            collapsed && "rotate-180",
          )}
        />
      </button>
    </nav>
  );
}
