"use client";

import { usePathname } from "next/navigation";

import { SectionTabs } from "@/components/SectionTabs";

const TABS = [
  { href: "/finance/accounts-payable", label: "Contas a pagar" },
  { href: "/finance/statement", label: "Extrato" },
  { href: "/finance/entries/new", label: "Lançamento manual" },
  { href: "/finance/company-account", label: "Conta da imobiliária" },
];

/** Client Component: precisa do pathname para marcar a aba ativa. */
export function FinanceSubNav() {
  const pathname = usePathname();
  const current = TABS.find((tab) => pathname?.startsWith(tab.href))?.href ?? TABS[0].href;

  return <SectionTabs ariaLabel="Seções do financeiro" tabs={TABS} current={current} storageKey="finance-subnav-collapsed" />;
}
