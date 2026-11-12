"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getAccountsPayableListQueryKey,
  getAccountsPayableRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useAccountsPayableCreate,
  useAccountsPayablePartialUpdate,
} from "@/lib/api/generated";
import type { AccountPayable } from "@/lib/api/generated/models";
import { accountPayableUrl } from "@/lib/finance/account-payable-workspace";
import {
  accountPayableToPayload,
  type AccountPayableFormInput,
  type AccountPayableFormOutput,
} from "@/lib/schemas/account-payable";

/** Salvar uma edição deixa na página; cadastrar abre a conta nova (a lista ao lado já a mostra). */
export function useAccountPayableSubmit(accountId: string | undefined, setError: UseFormSetError<AccountPayableFormInput>) {
  return useRecordSubmit<AccountPayableFormInput, AccountPayableFormOutput, AccountPayable>({
    recordId: accountId,
    setError,
    toPayload: accountPayableToPayload,
    create: useAccountsPayableCreate(),
    update: useAccountsPayablePartialUpdate(),
    invalidate: (id) => [getAccountsPayableListQueryKey(), getAccountsPayableRetrieveQueryKey(id), getDashboardRetrieveQueryKey()],
    messages: { updated: "Conta salva.", created: "Conta cadastrada." },
    redirect: (account, created) => (created ? accountPayableUrl(account.id) : undefined),
  });
}
