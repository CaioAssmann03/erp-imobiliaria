import Link from "next/link";

import { StatusText } from "@/components/StatusText";
import type { CostCenter } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { withFrom } from "@/lib/navigation/back-target";
import { costCenterUrl } from "@/lib/condominiums/cost-center-workspace";
import { cn } from "@/lib/utils";

/**
 * Uma sub-conta na lista no padrão da lista de condomínios: o código (cinza) e o nome. `isOpen` marca a aberta e `dimmed` apaga as outras
 * quando há uma aberta; `onCard` é para a lista dentro de um cartão branco. `withStatus` (só na tela de sub-contas do condomínio) põe a
 * situação em texto (verde ou preto) à direita; na coluna lateral só a inativa é dita, abaixo do nome.
 */
export function CostCenterListItem({
  costCenter,
  isOpen = false,
  dimmed = false,
  onCard = false,
  withStatus = false,
  from,
}: {
  costCenter: CostCenter;
  isOpen?: boolean;
  dimmed?: boolean;
  onCard?: boolean;
  withStatus?: boolean;
  /** A tela de onde se chegou (o "voltar" da sub-conta leva a ela). */
  from?: string | null;
}) {
  const active = costCenter.active ?? true;

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-panel transition-[background-color,opacity]",
        onCard ? "hover:bg-surface-muted" : "hover:bg-surface",
        isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
        dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-within:opacity-100"
      )}
    >
      <Link
        href={withFrom(costCenterUrl(costCenter.id), from)}
        aria-current={isOpen ? "page" : undefined}
        className="block min-w-0 flex-1 rounded-panel px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="block truncate text-body font-medium">
          <span className="tabular-nums">{formatCode(costCenter.code)}</span>
          <span className="text-ink-faint"> · </span>
          {costCenter.name}
        </span>
        {!withStatus && !active && <span className="block truncate text-caption text-ink-soft">Inativo</span>}
      </Link>
      {withStatus && <StatusText active={active} className="mr-3 shrink-0" />}
    </li>
  );
}
