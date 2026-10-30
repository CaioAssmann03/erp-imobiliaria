"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormActions } from "@/components/form/FormActions";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { accountsPayableUrl } from "@/lib/account-payable-workspace";
import { useAccountsPayableRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  ACCOUNT_PAYABLE_DEFAULTS,
  accountPayableSchema,
  accountPayableToForm,
  type AccountPayableFormInput,
  type AccountPayableFormOutput,
} from "@/lib/schemas/account-payable";

import { AccountPayableSummary } from "./AccountPayableSummary";
import { CancelAccountPayableButton } from "./CancelAccountPayableButton";
import { PaymentReceiptsSection } from "./PaymentReceiptsSection";
import { SettleAccountPayableDialog } from "./SettleAccountPayableDialog";
import { AmountsSection } from "./account-payable-form/AmountsSection";
import { HolderSection } from "./account-payable-form/HolderSection";
import { useAccountPayableSubmit } from "./account-payable-form/use-account-payable-submit";

/** Cadastro e edição de conta a pagar. Uma conta paga ou cancelada só pode ser consultada. */
export function AccountPayableForm({ accountId }: { accountId?: string }) {
  const router = useRouter();
  const isEdit = accountId !== undefined;

  const { data: account, isLoading, error: loadError } = useAccountsPayableRetrieve(accountId ?? "", { query: { enabled: isEdit } });
  throwIfNotFound(loadError);

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
  if (account && account.status !== "open") {
    return (
      <div className="flex flex-col gap-4">
        <div id="resumo" className="scroll-mt-20">
          <AccountPayableSummary account={account} />
        </div>
        {account.status === "paid" && (
          <div id="comprovantes" className="scroll-mt-20">
            <PaymentReceiptsSection accountId={account.id} />
          </div>
        )}
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <div id="despesa" className="scroll-mt-20">
          <HolderSection />
        </div>
        <div id="conta" className="scroll-mt-20">
          <AmountsSection />
        </div>
        <FormActions
          isSubmitting={isSubmitting}
          danger={account && <CancelAccountPayableButton accountId={account.id} description={account.description} />}
        >
          {account && <SettleAccountPayableDialog account={account} solid />}
          <Button type="button" variant="secondary" onClick={() => router.push(accountsPayableUrl())}>
            Fechar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
