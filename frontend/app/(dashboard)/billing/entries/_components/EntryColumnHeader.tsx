import Link from "next/link";

import type { BillingEntry } from "@/lib/api/generated/models";
import { entryColumnTitle } from "@/lib/billing-entry-payload";
import { billingEntryUrl, type BillingEntriesScope } from "@/lib/billing-entry-workspace";
import { brl } from "@/lib/format";

import { entryDestinationLabel } from "./BillingEntryListItem";

/** O cabeçalho de uma coluna da grade: o nome do boleto (abre o lançamento), a sub-conta e o total. Excluir e encerrar ficam no lançamento aberto. */
export function EntryColumnHeader({ entry, total, scope }: { entry: BillingEntry; total: string; scope: BillingEntriesScope }) {
  return (
    <div className="min-w-36 space-y-0.5 text-left font-normal">
      <Link href={billingEntryUrl(entry.id, scope)} className="font-medium text-ink underline-offset-2 outline-none hover:underline focus-visible:underline">
        {entryColumnTitle(entry).title}
      </Link>
      <p className="text-caption text-ink-soft">{entryDestinationLabel(entry)}</p>
      <p className="text-caption tabular-nums text-ink-soft">Total {brl(total)}</p>
    </div>
  );
}
