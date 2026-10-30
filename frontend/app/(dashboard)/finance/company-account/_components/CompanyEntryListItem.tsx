import Link from "next/link";

import type { CompanyEntry } from "@/lib/api/generated/models";
import { companyEntryUrl } from "@/lib/company-account-workspace";
import { brl, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Um lançamento da imobiliária na lista no padrão da lista de condomínios: a descrição em cima e embaixo a data e o valor. `isOpen` marca o
 * aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function CompanyEntryListItem({ entry, isOpen = false, dimmed = false }: { entry: CompanyEntry; isOpen?: boolean; dimmed?: boolean }) {
  return (
    <li>
      <Link
        href={companyEntryUrl(entry.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">{entry.description}</span>
        <span className="block truncate text-caption tabular-nums text-ink-soft">
          {formatDate(entry.entry_date)} · {brl(entry.amount)}
        </span>
      </Link>
    </li>
  );
}
