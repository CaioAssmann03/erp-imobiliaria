import Link from "next/link";

import type { Unit } from "@/lib/api/generated/models";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { unitListLabel, unitUrl } from "@/lib/unit-workspace";
import { cn } from "@/lib/utils";

import { currentLinks } from "./current-links";

/**
 * Uma unidade na lista no padrão da lista de condomínios: tipo e nome em cima; embaixo bloco, proprietário, síndico e inativa.
 * `isOpen` marca a unidade aberta; `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 * `onCard` é para quando a lista está dentro de um cartão branco (o realce ao passar o mouse precisa de outro tom).
 */
export function UnitListItem({
  unit,
  blockName,
  isOpen = false,
  dimmed = false,
  onCard = false,
}: {
  unit: Unit;
  blockName: string | null;
  isOpen?: boolean;
  dimmed?: boolean;
  onCard?: boolean;
}) {
  const owner = currentLinks(unit).find((link) => link.role === "owner")?.person_detail.name;
  const sub = [blockName, owner, unit.is_manager_unit ? "Síndico" : null, unit.active ? null : "Inativa"]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        href={unitUrl(unit.condominium, unit.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity]",
          onCard ? "hover:bg-surface-muted" : "hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">{unitListLabel(unitTypeLabel(unit.type), unit.name)}</span>
        <span className="block truncate text-caption text-ink-soft">{sub || "—"}</span>
      </Link>
    </li>
  );
}
