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
import { accountPayableUrl } from "@/lib/account-payable-workspace";
import { applyServerErrors } from "@/lib/form-errors";
import {
  accountPayableToPayload,
  type AccountPayableFormInput,
  type AccountPayableFormOutput,
} from "@/lib/schemas/account-payable";

export function useAccountPayableSubmit(
  accountId: string | undefined,
  setError: UseFormSetError<AccountPayableFormInput>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useAccountsPayableCreate();
  const updateMutation = useAccountsPayablePartialUpdate();
  const isEdit = accountId !== undefined;

  // Salvar uma edição deixa na página; cadastrar abre a conta nova (a lista ao lado já a mostra).
  const done = (message: string, id: string, opensAccount: boolean) => {
    queryClient.invalidateQueries({ queryKey: getAccountsPayableListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getAccountsPayableRetrieveQueryKey(id) });
    queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
    toast.success(message);
    if (opensAccount) router.push(accountPayableUrl(id));
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: AccountPayableFormOutput) => {
    const payload = accountPayableToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: accountId, data: payload as Partial<AccountPayable> },
        { onSuccess: () => done("Conta salva.", accountId, false), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as AccountPayable },
        { onSuccess: (created) => done("Conta cadastrada.", created.id, true), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
