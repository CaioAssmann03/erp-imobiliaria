import Link from "next/link";

import type { BillingEntry } from "@/lib/api/generated/models";
import { entryColumnTitle, formatCode } from "@/lib/billing/billing-entry-payload";
import { billingEntryUrl, type BillingEntriesScope } from "@/lib/billing/billing-entry-workspace";
import { brl } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/** A linha de baixo de um lançamento: a sub-conta (ou a conta da imobiliária), a parcela e se repete sempre. */
export function entryDestinationLabel(entry: BillingEntry): string {
  const { installment } = entryColumnTitle(entry);
  const destination = entry.event_credits_company ? "Conta da imobiliária" : `(${formatCode(entry.cost_center_code)}) ${entry.cost_center_name}`;
  return [destination, installment, entry.recurrence === "always" ? "sempre" : ""].filter(Boolean).join(" · ");
}

/**
 * Um lançamento do mês na lista no padrão da lista de condomínios: o nome do boleto e o total do mês em cima, a sub-conta embaixo. `isOpen` marca o
 * aberto e `dimmed` apaga os outros quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function BillingEntryListItem({
  entry,
  total,
  scope,
  isOpen = false,
  dimmed = false,
}: {
  entry: BillingEntry;
  total: string;
  scope: BillingEntriesScope;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  return (
    <li>
      <Link
        href={billingEntryUrl(entry.id, scope)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate text-body font-medium">{entryColumnTitle(entry).title}</span>
          <span className="shrink-0 text-caption tabular-nums text-ink-soft">{brl(total)}</span>
        </span>
        <span className="block truncate text-caption text-ink-soft">{entryDestinationLabel(entry)}</span>
      </Link>
    </li>
  );
}
