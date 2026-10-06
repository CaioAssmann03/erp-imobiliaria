"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useAccountsPayableRetrieve } from "@/lib/api/generated";
import {
  ACCOUNT_PAYABLE_DEFAULTS,
  accountPayableSchema,
  accountPayableToForm,
  type AccountPayableFormInput,
  type AccountPayableFormOutput,
} from "@/lib/schemas/account-payable";

import { AccountPayableSummary } from "./AccountPayableSummary";
import { AmountsSection } from "./account-payable-form/AmountsSection";
import { HolderSection } from "./account-payable-form/HolderSection";
import { ACCOUNTS_PAYABLE_URL, useAccountPayableSubmit } from "./account-payable-form/use-account-payable-submit";

/** Cadastro e edição de conta a pagar. Uma conta paga ou cancelada só pode ser consultada. */
export function AccountPayableForm({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const isEdit = accountId !== undefined;

  const { data: account, isLoading } = useAccountsPayableRetrieve(accountId ?? "", { query: { enabled: isEdit } });

  const methods = useForm<AccountPayableFormInput, unknown, AccountPayableFormOutput>({
    resolver: zodResolver(accountPayableSchema),
    defaultValues: ACCOUNT_PAYABLE_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useAccountPayableSubmit(accountId, setError);

  useEffect(() => {
    if (account) reset(accountPayableToForm(account));
  }, [account, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;
  if (account && account.status !== "open") return <AccountPayableSummary account={account} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <HolderSection />
        <AmountsSection />
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push(ACCOUNTS_PAYABLE_URL)}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
