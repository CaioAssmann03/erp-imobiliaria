"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { FORM_SECTIONS, formSectionHref, parseFormSection, showFormSection } from "@/lib/condominium-sections";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "condominium-nav-collapsed";
const COLLAPSED_EVENT = `${COLLAPSED_KEY}:change`;

const subscribeCollapsed = (onChange: () => void) => {
  window.addEventListener(COLLAPSED_EVENT, onChange);
  return () => window.removeEventListener(COLLAPSED_EVENT, onChange);
};
/** A escolha fica neste navegador; o armazenamento pode estar indisponível (então fica aberto). */
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
};

interface NavItem {
  href: string;
  label: string;
  active: boolean;
  onClick?: (event: React.MouseEvent) => void;
  scroll?: boolean;
}

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <div>
      <p className="mb-1 hidden px-3 text-caption text-ink-faint xl:block">{label}</p>
      <ul className="flex gap-6 xl:flex-col xl:gap-0.5">
        {items.map((item) => (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              scroll={item.scroll}
              onClick={item.onClick}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "-mb-px block border-b-2 py-2 text-body whitespace-nowrap outline-none transition-colors focus-visible:text-ink xl:mb-0 xl:border-b-0 xl:border-l-2 xl:py-1.5 xl:pl-3",
                item.active ? "border-brand font-medium text-ink" : "border-transparent text-ink-soft hover:text-ink"
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
 * Client Component: tudo o que há num condomínio, só texto, em dois grupos: **Cadastro** (as seções do formulário,
 * uma por vez no meio; trocar entre elas nem vai ao servidor) e **Gestão** (as listas ligadas ao condomínio). Fica
 * no layout de `[id]`, então trocar de item não recarrega nada. No desktop largo (xl) é uma coluna à direita, com um
 * botão que recolhe tudo; abaixo disso, uma fileira sob o nome (sem os títulos dos grupos). O item atual leva uma
 * marca laranja.
 */
export function CondominiumSectionNav({ condominiumId, className }: { condominiumId: string; className?: string }) {
  const pathname = usePathname();
  const currentSection = parseFormSection(useSearchParams().get("section"));
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const toggleCollapsed = () => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event(COLLAPSED_EVENT));
  };
  const base = `/condominiums/${condominiumId}`;

  const registration: NavItem[] = FORM_SECTIONS.map((section) => ({
    href: formSectionHref(base, section.id),
    label: section.label,
    active: pathname === base && currentSection === section.id,
    scroll: false,
    onClick: (event) => {
      if (pathname !== base) return;
      event.preventDefault();
      showFormSection(section.id);
    },
  }));
  const management: NavItem[] = [
    { href: `${base}/units`, label: "Unidades", active: pathname.startsWith(`${base}/units`) },
    { href: `${base}/blocks`, label: "Blocos", active: pathname.startsWith(`${base}/blocks`) },
    { href: `${base}/cost-centers`, label: "Sub-contas", active: pathname.startsWith(`${base}/cost-centers`) },
    { href: `/finance/statement?condominium=${condominiumId}`, label: "Extrato", active: false },
  ];

  return (
    <nav
      aria-label="Seções do condomínio"
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
        aria-label={collapsed ? "Mostrar menu do condomínio" : "Recolher menu do condomínio"}
        title={collapsed ? "Mostrar menu" : "Recolher menu"}
        className="mb-2 ml-auto hidden size-8 items-center justify-center rounded-control text-ink-faint outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50 xl:flex"
      >
        {collapsed ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}
      </button>
      <div className={cn("flex gap-6 xl:flex-col xl:gap-6", collapsed && "xl:hidden")}>
        <NavGroup label="Cadastro" items={registration} />
        <NavGroup label="Gestão" items={management} />
      </div>
    </nav>
  );
}
