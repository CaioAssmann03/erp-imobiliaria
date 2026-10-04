"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { RowActions, RowLink } from "@/components/data-list";
import { LinkButton } from "@/components/LinkButton";
import { StatusBadge } from "@/components/StatusBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Person } from "@/lib/api/generated/models";
import { formattedPersonDocument } from "@/lib/person-document";

interface PersonRowProps {
  person: Person;
  onDelete: (id: string) => void;
}

export function PersonRow({ person, onDelete }: PersonRowProps) {
  const document = formattedPersonDocument(person);

  return (
    <TableRow>
      <TableCell>
        <RowLink
          href={`/persons/${person.id}`}
          sub={[person.email || document, person.active ? null : "Inativo"].filter(Boolean).join(" · ")}
        >
          {person.name}
        </RowLink>
      </TableCell>
      <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">{document || "—"}</TableCell>
      <TableCell className="hidden md:table-cell text-ink-soft tabular-nums">{person.cell_number || "—"}</TableCell>
      <TableCell
        className="hidden md:table-cell max-w-[14rem] truncate text-ink-soft"
        title={person.email || undefined}
      >
        {person.email || "—"}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <StatusBadge active={person.active} />
      </TableCell>
      <TableCell>
        <RowActions>
          <LinkButton variant="ghost" size="sm" className="hidden md:inline-flex" href={`/persons/${person.id}`}>
            Editar
          </LinkButton>
          <ConfirmDeleteButton
            title="Excluir pessoa?"
            description={`"${person.name}" será excluída. Esta ação não pode ser desfeita.`}
            onConfirm={() => onDelete(person.id)}
          />
        </RowActions>
      </TableCell>
    </TableRow>
  );
}
