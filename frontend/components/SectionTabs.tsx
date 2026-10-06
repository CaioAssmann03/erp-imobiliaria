"use client";

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

interface SectionTabsProps {
  ariaLabel: string;
  tabs: readonly { href: string; label: string }[];
  /** `href` da aba ativa (quem usa decide pelo pathname). */
  current: string;
  /** Chave do navegador que lembra se as abas estão recolhidas. */
  storageKey: string;
}

/**
 * Abas de uma seção (Condomínios, Financeiro): links sublinhados, recolhíveis, lembrando a
 * escolha neste navegador (o storage pode estar indisponível).
 */
export function SectionTabs({ ariaLabel, tabs, current, storageKey }: SectionTabsProps) {
  const changeEvent = `${storageKey}:change`;
  const collapsed = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(changeEvent, onChange);
      return () => window.removeEventListener(changeEvent, onChange);
    },
    () => {
      try {
        return localStorage.getItem(storageKey) === "1";
      } catch {
        return false;
      }
    },
    () => false
  );

  const toggle = () => {
    try {
      localStorage.setItem(storageKey, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(changeEvent));
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1 border-b border-line", collapsed ? "mb-3 justify-end" : "mb-6")}
    >
      {!collapsed &&
        tabs.map((tab) => {
          const active = tab.href === current;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-body font-medium transition-colors",
                active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
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
        <ChevronUp className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </nav>
  );
}
