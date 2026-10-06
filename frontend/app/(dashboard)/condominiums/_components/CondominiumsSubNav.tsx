"use client";

import { usePathname } from "next/navigation";

import { SectionTabs } from "@/components/SectionTabs";

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
  return (
    <SectionTabs
      ariaLabel="Seções de condomínios"
      tabs={TABS}
      current={activeTab(usePathname())}
      storageKey="condominiums-subnav-collapsed"
    />
  );
}
