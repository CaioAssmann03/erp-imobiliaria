"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import {
  getBillingEntriesListQueryKey,
  useBillingEntriesDestroy,
  useBillingEntriesEnd,
} from "@/lib/api/generated";
import type { BillingEntry } from "@/lib/api/generated/models";
import { entryColumnTitle, formatCode } from "@/lib/billing-entry-payload";
import { brl, formatMonth } from "@/lib/format";
import { applyServerErrors } from "@/lib/form-errors";

interface EntryColumnHeaderProps {
  entry: BillingEntry;
  total: string;
  /** Primeiro dia do mês que a grade mostra ("2026-10-01"). */
  referenceMonth: string;
}

/** O cabeçalho de uma coluna: o lançamento, o total, a sub-conta e as ações (excluir, ou encerrar o que se repete). */
export function EntryColumnHeader({ entry, total, referenceMonth }: EntryColumnHeaderProps) {
  const queryClient = useQueryClient();
  const destroyMutation = useBillingEntriesDestroy();
  const endMutation = useBillingEntriesEnd();
  const { title, installment } = entryColumnTitle(entry);
  const refresh = () => queryClient.invalidateQueries({ queryKey: getBillingEntriesListQueryKey() });
  const onError = (error: unknown) => toast.error(applyServerErrors(error, () => undefined));

  return (
    <div className="min-w-36 space-y-0.5 text-left font-normal">
      <p className="font-medium text-ink">{title}</p>
      <p className="text-caption text-ink-soft">
        ({formatCode(entry.cost_center_code)}) {entry.cost_center_name}
        {installment && ` · ${installment}`}
        {entry.recurrence === "always" && " · sempre"}
      </p>
      <p className="text-caption tabular-nums text-ink-soft">Total {brl(total)}</p>
      <div className="flex gap-1">
        {entry.recurrence === "always" && (
          <ConfirmDeleteButton
            label="Encerrar"
            title="Encerrar lançamento?"
            description={`O lançamento "${title}" deixa de entrar nos boletos depois de ${formatMonth(referenceMonth)}. Os boletos já emitidos não mudam.`}
            onConfirm={() =>
              endMutation.mutate(
                { id: entry.id, data: { end_month: referenceMonth } },
                {
                  onSuccess: () => {
                    refresh();
                    toast.success("Lançamento encerrado.");
                  },
                  onError,
                }
              )
            }
          />
        )}
        {!entry.is_used && (
          <ConfirmDeleteButton
            title="Excluir lançamento?"
            description={`O lançamento "${title}" será excluído de todos os meses. Esta ação não pode ser desfeita.`}
            onConfirm={() =>
              destroyMutation.mutate(
                { id: entry.id },
                {
                  onSuccess: () => {
                    refresh();
                    toast.success("Lançamento excluído.");
                  },
                  onError,
                }
              )
            }
          />
        )}
      </div>
    </div>
  );
}
