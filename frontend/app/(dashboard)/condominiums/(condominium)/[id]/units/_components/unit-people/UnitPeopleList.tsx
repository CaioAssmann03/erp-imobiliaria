"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import type { Person } from "@/lib/api/generated/models";

import { linkSummary, type LinkSummarySource } from "./unit-link-summary";

/** Um vínculo na lista: o salvo (`UnitPerson`) ou o que ainda vai ser salvo com a unidade nova (`PendingLink`, ver `pendingLinkRow`). */
export type LinkRow = LinkSummarySource & { id: string; person_detail: Pick<Person, "name" | "code"> };

interface UnitPeopleListProps {
  links: readonly LinkRow[];
  onRemove: (linkId: string) => void;
}

export function UnitPeopleList({ links, onRemove }: UnitPeopleListProps) {
  if (links.length === 0) {
    return <p className="text-body text-ink-soft">Nenhuma pessoa vinculada ainda.</p>;
  }

  return (
    <ul className="space-y-1">
      {links.map((link) => (
        <li
          key={link.id}
          className="flex items-center justify-between rounded-panel bg-surface-muted px-4 py-2.5"
        >
          <div className="min-w-0">
            <div className="truncate font-medium">{link.person_detail.name}</div>
            <div className="text-caption text-ink-soft">
              ID {link.person_detail.code} · {linkSummary(link)}
            </div>
          </div>
          <ConfirmDeleteButton
            label="Remover"
            title="Remover vínculo?"
            description={`${link.person_detail.name} deixará de estar vinculado(a) a esta unidade.`}
            onConfirm={() => onRemove(link.id)}
          />
        </li>
      ))}
    </ul>
  );
}
