"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getAccountsPayableListQueryKey,
  getAccountsPayableRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useAccountsPayableCreate,
  useAccountsPayablePartialUpdate,
} from "@/lib/api/generated";
import type { AccountPayable } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import {
  accountPayableToPayload,
  type AccountPayableFormInput,
  type AccountPayableFormOutput,
} from "@/lib/schemas/account-payable";

export const ACCOUNTS_PAYABLE_URL = "/finance/accounts-payable";

export function useAccountPayableSubmit(
  accountId: string | undefined,
  setError: UseFormSetError<AccountPayableFormInput>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useAccountsPayableCreate();
  const updateMutation = useAccountsPayablePartialUpdate();
  const isEdit = accountId !== undefined;

  const done = (message: string, id: string) => {
    queryClient.invalidateQueries({ queryKey: getAccountsPayableListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAccountsPayableRetrieveQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
    toast.success(message);
    router.push(ACCOUNTS_PAYABLE_URL);
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: AccountPayableFormOutput) => {
    const payload = accountPayableToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: accountId, data: payload as Partial<AccountPayable> },
        { onSuccess: () => done("Conta salva.", accountId), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as AccountPayable },
        { onSuccess: (created) => done("Conta cadastrada.", created.id), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
