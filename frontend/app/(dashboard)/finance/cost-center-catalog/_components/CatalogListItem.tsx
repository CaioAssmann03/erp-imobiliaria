import type { CostCenterCatalogItem } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/format/format";
import { catalogItemUrl } from "@/lib/finance/cost-center-catalog-workspace";
import { RegistryListItem } from "@/components/layout/RegistryList";

/**
 * Uma sub-conta na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo em quantos condomínios ela é usada e,
 * se for o caso, "Inativa". `isOpen` marca a aberta e `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function CatalogListItem({ item, isOpen = false, dimmed = false }: { item: CostCenterCatalogItem; isOpen?: boolean; dimmed?: boolean }) {
  const uses = item.cost_center_count === 1 ? "1 condomínio" : `${item.cost_center_count} condomínios`;
  const sub = [uses, item.active === false ? "Inativa" : null].filter(Boolean).join(" · ");

  return (
    <RegistryListItem href={catalogItemUrl(item.id)} isOpen={isOpen} dimmed={dimmed}>
      <span className="block truncate text-body font-medium">
        <span className="tabular-nums">{formatCode(item.code ?? 0)}</span>
        <span className="text-ink-faint"> · </span>
        {item.name}
      </span>
      <span className="block truncate text-caption text-ink-soft">{sub}</span>
    </RegistryListItem>
  );
}
