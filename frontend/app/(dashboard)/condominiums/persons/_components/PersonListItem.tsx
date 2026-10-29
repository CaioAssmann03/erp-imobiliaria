import Link from "next/link";

import type { Person } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing-entry-payload";
import { formattedPersonDocument } from "@/lib/person-document";
import { personUrl } from "@/lib/person-workspace";
import { cn } from "@/lib/utils";

/**
 * Uma pessoa na lista no padrão da lista de condomínios: o código (cinza) e o nome em cima; embaixo o CPF/CNPJ (ou o e-mail) e "Inativa".
 * `isOpen` marca a aberta e `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function PersonListItem({ person, isOpen = false, dimmed = false }: { person: Person; isOpen?: boolean; dimmed?: boolean }) {
  const sub = [formattedPersonDocument(person) || person.email, person.active ? null : "Inativa"].filter(Boolean).join(" · ");

  return (
    <li>
      <Link
        href={personUrl(person.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">
          <span className="tabular-nums">{formatCode(person.code)}</span>
          <span className="text-ink-faint"> · </span>
          {person.name}
        </span>
        <span className="block truncate text-caption text-ink-soft">{sub || "—"}</span>
      </Link>
    </li>
  );
}
