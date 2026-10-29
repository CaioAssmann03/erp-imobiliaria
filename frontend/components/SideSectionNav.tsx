"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

export interface SideNavItem {
  href: string;
  label: string;
  active: boolean;
  onClick?: (event: React.MouseEvent) => void;
  scroll?: boolean;
}

export interface SideNavGroup {
  /** Título do grupo (só aparece na coluna, de `xl` em diante). */
  label?: string;
  items: SideNavItem[];
}

function NavGroup({ label, items }: SideNavGroup) {
  return (
    <div>
      {label && <p className="mb-1 hidden px-3 text-caption text-ink-faint xl:block">{label}</p>}
      <ul className="flex gap-1 xl:flex-col">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              scroll={item.scroll}
              onClick={item.onClick}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "block rounded-panel px-3 py-2 text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                item.active ? "bg-surface-sunken/70 font-medium text-ink" : "text-ink-soft hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Client Component: menu das seções de um módulo, só texto, em grupos. No desktop largo (xl) é uma coluna à direita, com um
 * botão que recolhe tudo (a escolha fica em `localStorage` sob `storageKey`; o armazenamento pode estar indisponível, então
 * fica aberto); abaixo disso, uma fileira sob o título (sem os títulos dos grupos). O item atual tem o mesmo destaque do
 * condomínio escolhido na lista de Condomínios.
 */
export function SideSectionNav({
  ariaLabel,
  groups,
  storageKey,
  className,
}: {
  ariaLabel: string;
  groups: SideNavGroup[];
  storageKey: string;
  className?: string;
}) {
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
  const toggleCollapsed = () => {
    try {
      localStorage.setItem(storageKey, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(changeEvent));
  };

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "-mx-4 overflow-x-auto px-4 xl:mx-0 xl:overflow-visible xl:px-0",
        collapsed ? "xl:w-8" : "xl:w-44",
        className
      )}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Mostrar menu" : "Recolher menu"}
        title={collapsed ? "Mostrar menu" : "Recolher menu"}
        className="mb-2 ml-auto hidden size-8 items-center justify-center rounded-control text-ink-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 xl:flex"
      >
        {collapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
      </button>
      <div className={cn("flex gap-3 xl:flex-col xl:gap-6", collapsed && "xl:hidden")}>
        {groups.map((group, index) => (
          <NavGroup key={group.label ?? index} {...group} />
        ))}
      </div>
    </nav>
  );
}
