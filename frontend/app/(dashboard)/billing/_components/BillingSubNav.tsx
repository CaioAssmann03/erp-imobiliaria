"use client";

import { usePathname } from "next/navigation";

import { SectionTabs } from "@/components/SectionTabs";

const TABS = [
  { href: "/billing/entries", label: "Inclusão de valores" },
  { href: "/billing/plans", label: "Planos de cobrança" },
  { href: "/billing/extra", label: "Boleto extra" },
  { href: "/billing/documents", label: "Documentos" },
  { href: "/billing/runs", label: "Execuções" },
  { href: "/billing/events", label: "Eventos" },
];

/** Client Component: precisa do pathname para marcar a aba ativa. */
export function BillingSubNav() {
  const pathname = usePathname();
  const current = TABS.find((tab) => pathname?.startsWith(tab.href))?.href ?? TABS[0].href;

  return <SectionTabs ariaLabel="Seções de cobrança" tabs={TABS} current={current} storageKey="billing-subnav-collapsed" />;
}
