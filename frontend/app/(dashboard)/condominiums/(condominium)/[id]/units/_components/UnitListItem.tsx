import Link from "next/link";

import type { Unit } from "@/lib/api/generated/models";
import { unitTypeLabel } from "@/lib/schemas/unit";
import { unitListLabel, unitUrl } from "@/lib/condominiums/unit-workspace";
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
  condominiumName = null,
  isOpen = false,
  dimmed = false,
  onCard = false,
  context,
}: {
  unit: Unit;
  blockName: string | null;
  /** Só quando a lista mistura condomínios (a pendência do painel): o nome do condomínio vai na segunda linha. */
  condominiumName?: string | null;
  isOpen?: boolean;
  dimmed?: boolean;
  onCard?: boolean;
  /** De onde se chegou: o bloco que recorta a lista (segue com ela) e a tela de origem, a que o "voltar" da unidade leva (a sub-tela de unidades de um bloco). */
  context?: { block?: string | null; from?: string | null; pending?: string | null; condominium?: string | null };
}) {
  const query = new URLSearchParams();
  if (context?.block) query.set("block", context.block);
  if (context?.from) query.set("from", context.from);
  if (context?.pending) query.set("pending", context.pending);
  if (context?.condominium) query.set("condominium", context.condominium);
  const owner = currentLinks(unit).find((link) => link.role === "owner")?.person_detail.name;
  const sub = [condominiumName, blockName, owner, unit.is_manager_unit ? "Síndico" : null, unit.active ? null : "Inativa"]
    .filter(Boolean)
    .join(" · ");

  return (
    <li>
      <Link
        href={`${unitUrl(unit.condominium, unit.id)}${query.size > 0 ? `?${query}` : ""}`}
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
