"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { getBillingEntriesListQueryKey, getBillingEntriesRetrieveQueryKey, useBillingEntriesDestroy, useBillingEntriesEnd } from "@/lib/api/generated";
import type { BillingEntry } from "@/lib/api/generated/models";
import { billingEntriesUrl } from "@/lib/billing/billing-entry-workspace";
import { formatMonth } from "@/lib/format/format";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";

import { useEntriesScope } from "./use-entries-scope";

/**
 * Client Component: as ações do lançamento aberto. **Encerrar** (o que se repete sempre): deixa de entrar nos boletos depois do mês da lista, e o
 * lançamento continua aberto. **Excluir** (só quando nenhum boleto o usou): apaga de todos os meses e volta à grade do mês.
 */
export function EntryActions({ entry, title }: { entry: BillingEntry; title: string }) {
  const router = useRouter();
  const scope = useEntriesScope();
  const queryClient = useQueryClient();
  const destroyMutation = useBillingEntriesDestroy();
  const endMutation = useBillingEntriesEnd();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getBillingEntriesListQueryKey() });
  const onError = (error: unknown) => toast.error(applyServerErrors(error, () => undefined));
  const canEnd = entry.recurrence === "always" && !entry.end_month;

  if (!canEnd && entry.is_used) {
    return <p className="text-caption text-ink-soft">Este lançamento já saiu em boletos: não pode ser excluído.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canEnd && (
        <ConfirmDeleteButton
          appearance="solid"
          label="Encerrar"
          title="Encerrar lançamento?"
          description={`O lançamento "${title}" deixa de entrar nos boletos depois de ${formatMonth(scope.month)}. Os boletos já emitidos não mudam.`}
          onConfirm={() =>
            endMutation.mutate(
              { id: entry.id, data: { end_month: scope.month } },
              {
                onSuccess: () => {
                  refresh();
                  queryClient.invalidateQueries({ queryKey: getBillingEntriesRetrieveQueryKey(entry.id) });
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
          appearance="solid"
          title="Excluir lançamento?"
          description={`O lançamento "${title}" será excluído de todos os meses. Esta ação não pode ser desfeita.`}
          onConfirm={() =>
            destroyMutation.mutate(
              { id: entry.id },
              {
                onSuccess: () => {
                  refresh();
                  toast.success("Lançamento excluído.");
                  router.push(billingEntriesUrl(scope));
                },
                onError,
              }
            )
          }
        />
      )}
    </div>
  );
}
