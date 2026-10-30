"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { UseFormSetError } from "react-hook-form";

import {
  currentAccountsList,
  getCurrentAccountEntriesListQueryKey,
  getCurrentAccountsListQueryKey,
  getEntryBatchesListQueryKey,
  useCurrentAccountsCreate,
  useEntryBatchesCreate,
  useEntryBatchesPostEntries,
} from "@/lib/api/generated";
import type { BatchEntryLine, CurrentAccount, EntryBatch } from "@/lib/api/generated/models";
import { applyServerErrors, formFieldName } from "@/lib/form-errors";
import { entryBatchUrl } from "@/lib/entry-batch-workspace";
import {
  entryBatchToPayload,
  entryLineToPayload,
  type EntriesBatchFormInput,
  type EntriesBatchFormOutput,
} from "@/lib/schemas/entry-batch";
import { toast } from "@/lib/toast";

/** `entries.2.amount` (API) → `lines.2.amount` (formulário); a conta corrente da linha é o condomínio escolhido. */
function toFormPath(path: string): string {
  const match = /^entries\.(\d+)\.(.+)$/.exec(path);
  if (!match) return formFieldName(path);
  const field = match[2] === "current_account" ? "condominium" : match[2];
  return `lines.${match[1]}.${field}`;
}

/**
 * Lançamento manual em lote, em três chamadas: a conta corrente de cada condomínio (criada se faltar),
 * o lote e os lançamentos (todos juntos ou nenhum). Se os lançamentos forem recusados, o lote já criado
 * é reaproveitado ao tentar de novo, em vez de criar outro vazio.
 */
export function useEntriesBatchSubmit(setError: UseFormSetError<EntriesBatchFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createAccount = useCurrentAccountsCreate();
  const createBatch = useEntryBatchesCreate();
  const postEntries = useEntryBatchesPostEntries();
  const batchId = useRef<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAccountOf = async (condominium: string): Promise<string> => {
    const existing = await currentAccountsList({ condominium });
    if (existing.results[0]) return existing.results[0].id;
    const created = await createAccount.mutateAsync({ data: { condominium } as CurrentAccount });
    return created.id;
  };

  const submit = async (values: EntriesBatchFormOutput) => {
    setIsSubmitting(true);
    try {
      const accounts = new Map<string, string>();
      for (const condominium of new Set(values.lines.map((line) => line.condominium))) {
        accounts.set(condominium, await currentAccountOf(condominium));
      }
      if (!batchId.current) {
        const batch = await createBatch.mutateAsync({ data: entryBatchToPayload(values) as unknown as EntryBatch });
        batchId.current = batch.id;
      }
      const entries = values.lines.map(
        (line) => entryLineToPayload(line, accounts.get(line.condominium) as string) as unknown as BatchEntryLine
      );
      await postEntries.mutateAsync({ id: batchId.current, data: { entries } });

      queryClient.invalidateQueries({ queryKey: getCurrentAccountEntriesListQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCurrentAccountsListQueryKey() });
      queryClient.invalidateQueries({ queryKey: getEntryBatchesListQueryKey() });
      toast.success(entries.length === 1 ? "Lançamento registrado." : `${entries.length} lançamentos registrados.`);
      router.push(entryBatchUrl(batchId.current));
    } catch (error) {
      toast.error(applyServerErrors(error, setError, toFormPath));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
