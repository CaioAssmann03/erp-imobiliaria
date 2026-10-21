"use client";

import { usePathname } from "next/navigation";

import { SectionTabs } from "@/components/SectionTabs";

const TABS = [
  { href: "/billing/plans", label: "Planos de cobrança" },
  { href: "/billing/documents", label: "Documentos" },
  { href: "/billing/runs", label: "Execuções" },
];

/** Client Component: precisa do pathname para marcar a aba ativa. */
export function BillingSubNav() {
  const pathname = usePathname();
  const current = TABS.find((tab) => pathname?.startsWith(tab.href))?.href ?? TABS[0].href;

  return <SectionTabs ariaLabel="Seções de cobrança" tabs={TABS} current={current} storageKey="billing-subnav-collapsed" />;
}
