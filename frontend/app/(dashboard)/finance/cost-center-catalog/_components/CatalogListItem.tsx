import Link from "next/link";

import type { CostCenterCatalogItem } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing-entry-payload";
import { catalogItemUrl } from "@/lib/cost-center-catalog-workspace";
import { cn } from "@/lib/utils";

/**
 * Uma sub-conta na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo em quantos condomínios ela é usada e,
 * se for o caso, "Inativa". `isOpen` marca a aberta e `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function CatalogListItem({ item, isOpen = false, dimmed = false }: { item: CostCenterCatalogItem; isOpen?: boolean; dimmed?: boolean }) {
  const uses = item.cost_center_count === 1 ? "1 condomínio" : `${item.cost_center_count} condomínios`;
  const sub = [uses, item.active === false ? "Inativa" : null].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={catalogItemUrl(item.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">
          <span className="tabular-nums">{formatCode(item.code ?? 0)}</span>
          <span className="text-ink-faint"> · </span>
          {item.name}
        </span>
        <span className="block truncate text-caption text-ink-soft">{sub}</span>
      </Link>
    </li>
  );
}
