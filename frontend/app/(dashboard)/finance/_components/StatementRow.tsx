"use client";

import { RowActions } from "@/components/data-list";
import type { CurrentAccountEntry } from "@/lib/api/generated/models";
import { brl, formatDate, formatMonth } from "@/lib/format/format";
import { BATCH_ORIGINS } from "@/lib/schemas/entry-batch";
import { cn } from "@/lib/utils";

import { ReverseEntryDialog } from "./ReverseEntryDialog";

/**
 * Um lançamento do extrato, como linha de lista (sem tabela, sem rolagem lateral): data, descrição com uma linha de apoio
 * (condomínio quando há vários, sub-conta, unidade, nº) e o valor. Usada no extrato e nos lotes do lançamento manual. O resto (modelo, competência, lote) fica no `title`, ao passar o mouse.
 */
export function StatementRow({ entry, showCondominium = false }: { entry: CurrentAccountEntry; /** O lote reúne vários condomínios: a linha de apoio começa pelo nome do condomínio. */ showCondominium?: boolean }) {
  const isReversal = entry.reversal_of !== null;
  const note = [entry.is_reversed ? "Estornado" : null, isReversal ? "Estorno" : null].filter(Boolean).join(" · ");
  const origin = BATCH_ORIGINS.find((item) => item.value === entry.batch_origin)?.label ?? entry.batch_origin;
  const support = [showCondominium ? entry.condominium_name : null, entry.cost_center_name, entry.unit_name && `Unid. ${entry.unit_name}`, `Nº ${entry.registry}`, note]
    .filter(Boolean)
    .join(" · ");
  const fullDetails = [
    entry.entry_template_name,
    `Competência ${formatMonth(entry.competence_month)}`,
    `Lote: ${origin} ${formatDate(entry.batch_date)}`,
  ].join(" · ");
  const isCredit = entry.kind === "credit";
  const [year, month, day] = entry.entry_date.split("-");

  return (
    <li
      title={fullDetails}
      className={cn(
        "group/row flex items-start gap-3 rounded-panel px-3 py-3 transition-colors hover:bg-surface-muted sm:gap-4",
        entry.is_reversed && "text-ink-faint"
      )}
    >
      <time dateTime={entry.entry_date} title={`${day}/${month}/${year}`} className="w-11 shrink-0 pt-0.5 text-caption text-ink-soft tabular-nums">
        {day}/{month}
      </time>
      <div className="min-w-0 flex-1">
        <p className={cn("text-body [overflow-wrap:anywhere]", entry.is_reversed && "line-through")}>{entry.description}</p>
        <p className="mt-0.5 text-caption text-ink-soft [overflow-wrap:anywhere]">{support}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("whitespace-nowrap text-body font-medium tabular-nums", isCredit && !entry.is_reversed && "text-success")}>
          {isCredit ? "+" : "−"} {brl(entry.amount)}
        </p>
        <RowActions>{!entry.is_reversed && !isReversal && <ReverseEntryDialog entry={entry} />}</RowActions>
      </div>
    </li>
  );
}
