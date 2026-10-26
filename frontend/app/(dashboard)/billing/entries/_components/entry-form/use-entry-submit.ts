"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { getBillingEntriesListQueryKey, useBillingEntriesCreate } from "@/lib/api/generated";
import type { BillingEntry } from "@/lib/api/generated/models";
import { entryToPayload } from "@/lib/billing-entry-payload";
import { applyServerErrors } from "@/lib/form-errors";
import { billingEntryFormToValues, type BillingEntryFormInput, type BillingEntryFormOutput } from "@/lib/schemas/billing-entry";

/** Os erros das unidades chegam como `units.<n>.<campo>`; o formulário mostra o da lista inteira em `units`. */
const errorPath = (path: string): string => (path.startsWith("units") ? "units" : path);

export function useEntrySubmit(onCreated: () => void, setError: UseFormSetError<BillingEntryFormInput>) {
  const queryClient = useQueryClient();
  const createMutation = useBillingEntriesCreate();

  const submit = (values: BillingEntryFormOutput) => {
    const payload = entryToPayload(billingEntryFormToValues(values));
    createMutation.mutate(
      { data: payload as unknown as BillingEntry },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBillingEntriesListQueryKey() });
          toast.success("Lançamento incluído.");
          onCreated();
        },
        onError: (error) => toast.error(applyServerErrors(error, setError, errorPath)),
      }
    );
  };

  return { submit, isSubmitting: createMutation.isPending };
}
