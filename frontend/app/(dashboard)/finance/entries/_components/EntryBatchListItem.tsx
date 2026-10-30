import Link from "next/link";

import type { EntryBatch } from "@/lib/api/generated/models";
import { entryBatchUrl } from "@/lib/entry-batch-workspace";
import { formatDate } from "@/lib/format";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";
import { cn } from "@/lib/utils";

/** A origem do lote em texto: "Banco", "Caixa nº 12" ou "Caixa extra nº 3". */
export function batchOriginLabel(batch: Pick<EntryBatch, "origin" | "cash_number">) {
  const origin = BATCH_ORIGINS.find((item) => item.value === batch.origin)?.label ?? batch.origin;
  return batch.cash_number ? `${origin} nº ${batch.cash_number}` : origin;
}

/**
 * Um lote na lista no padrão da lista de condomínios: a data em cima e a origem embaixo. `isOpen` marca o aberto e `dimmed` apaga os outros
 * quando há um aberto (voltam ao passar o mouse ou focar).
 */
export function EntryBatchListItem({ batch, isOpen = false, dimmed = false }: { batch: EntryBatch; isOpen?: boolean; dimmed?: boolean }) {
  return (
    <li>
      <Link
        href={entryBatchUrl(batch.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium tabular-nums">{formatDate(batch.batch_date)}</span>
        <span className="block truncate text-caption text-ink-soft">{batchOriginLabel(batch)}</span>
      </Link>
    </li>
  );
}
