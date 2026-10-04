"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RowActions, RowLink } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Condominium } from "@/lib/api/generated/models";
import { maskCnpj } from "@/lib/masks";

interface CondominiumRowProps {
  condominium: Condominium;
  onDelete: (id: string) => void;
}

export function CondominiumRow({ condominium, onDelete }: CondominiumRowProps) {
  const city = condominium.address?.city
    ? `${condominium.address.city}/${condominium.address.state}`
    : null;

  return (
    <TableRow>
      <TableCell>
        <RowLink
          compact
          href={`/condominiums/${condominium.id}`}
          sub={[city, condominium.active ? null : "Inativo"].filter(Boolean).join(" · ")}
        >
          {condominium.name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">
        {condominium.cnpj ? maskCnpj(condominium.cnpj) : "—"}
      </TableCell>
      <TableCell className="hidden md:table-cell text-ink-soft">{city ?? "—"}</TableCell>
      <TableCell className="hidden md:table-cell">
        <StatusBadge active={condominium.active} />
      </TableCell>
      <TableCell>
        <div className="relative z-10 flex items-center justify-end gap-1">
          <LinkButton variant="secondary" size="sm" href={`/condominiums/${condominium.id}/units`}>
            Unidades
          </LinkButton>
          <RowActions>
            <LinkButton
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              href={`/condominiums/${condominium.id}`}
            >
              Editar
            </LinkButton>
            <ConfirmDeleteButton
              title="Excluir condomínio?"
              description={`O condomínio "${condominium.name}" será excluído. Esta ação não pode ser desfeita.`}
              onConfirm={() => onDelete(condominium.id)}
            />
          </RowActions>
        </div>
      </TableCell>
    </TableRow>
  );
}
