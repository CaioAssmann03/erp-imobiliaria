import { Building2, LayoutDashboard, Receipt, Users, Wallet } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/condominiums", label: "Condomínios", icon: Building2 },
  { href: "/finance", label: "Financeiro", icon: Wallet },
  { href: "/billing", label: "Cobrança", icon: Receipt },
  { href: "/persons", label: "Pessoas", icon: Users },
];

export function isNavItemActive(href: string, pathname: string | null) {
  return href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
}
