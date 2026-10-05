"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RowActions, RowLink } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Unit } from "@/lib/api/generated/models";
import { unitTypeLabel } from "@/lib/schemas/unit";

import { currentLinks } from "./current-links";

interface UnitRowProps {
  unit: Unit;
  condominiumId: string;
  blockName: string | null;
  /** Só na visão geral de unidades; `null` na lista de um condomínio. */
  condominiumName?: string | null;
  onDelete: (id: string) => void;
}

export function UnitRow({ unit, condominiumId, blockName, condominiumName = null, onDelete }: UnitRowProps) {
  const href = `/condominiums/${condominiumId}/units/${unit.id}`;
  const links = currentLinks(unit);

  return (
    <TableRow>
      <TableCell>
        <RowLink
          href={href}
          sub={[condominiumName, blockName, unitTypeLabel(unit.type), unit.active ? null : "Inativa"]
            .filter(Boolean)
            .join(" · ")}
        >
          {unit.name}
        </RowLink>
      </TableCell>
      {condominiumName !== null && (
        <TableCell className="hidden max-w-[16rem] truncate text-ink-soft md:table-cell">
          {condominiumName}
        </TableCell>
      )}
      <TableCell className="hidden md:table-cell text-ink-soft">{blockName ?? "—"}</TableCell>
      <TableCell className="hidden md:table-cell text-ink-soft">{unitTypeLabel(unit.type)}</TableCell>
      <TableCell className="hidden md:table-cell max-w-[22rem] truncate text-ink-soft">
        {links.length === 0
          ? "—"
          : links
              .map((link) => `${link.person_detail.name} (${link.role === "owner" ? "Prop." : "Loc."})`)
              .join(", ")}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <StatusBadge active={unit.active} />
      </TableCell>
      <TableCell>
        <RowActions>
          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={href}>
            Editar
          </LinkButton>
          <ConfirmDeleteButton
            title="Excluir unidade?"
            description={`A unidade "${unit.name}" será excluída. Esta ação não pode ser desfeita.`}
            onConfirm={() => onDelete(unit.id)}
          />
        </RowActions>
      </TableCell>
    </TableRow>
  );
}
