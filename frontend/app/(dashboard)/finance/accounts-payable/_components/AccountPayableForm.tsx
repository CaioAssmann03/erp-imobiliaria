"use client";

import { FormSkeleton } from "@/components/form/FormSkeleton";

import { accountsPayableUrl } from "@/lib/finance/account-payable-workspace";
import { useAccountsPayableRetrieve } from "@/lib/api/generated";
import { throwIfPageError } from "@/lib/query/page-error";
import { ACCOUNT_PAYABLE_DEFAULTS, accountPayableSchema, accountPayableToForm } from "@/lib/schemas/account-payable";

import { AccountPayableSummary } from "./AccountPayableSummary";
import { CancelAccountPayableButton } from "./CancelAccountPayableButton";
import { PaymentReceiptsSection } from "./PaymentReceiptsSection";
import { SettleAccountPayableDialog } from "./SettleAccountPayableDialog";
import { AmountsSection } from "./account-payable-form/AmountsSection";
import { HolderSection } from "./account-payable-form/HolderSection";
import { useAccountPayableSubmit } from "./account-payable-form/use-account-payable-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de conta a pagar. Uma conta paga ou cancelada só pode ser consultada. */
export function AccountPayableForm({ accountId }: { accountId?: string }) {
  const isEdit = accountId !== undefined;

  const { data: account, isLoading, error: loadError } = useAccountsPayableRetrieve(accountId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

  const methods = useRecordForm({ schema: accountPayableSchema, defaults: ACCOUNT_PAYABLE_DEFAULTS, record: account, toForm: accountPayableToForm });
  const { submit, isSubmitting } = useAccountPayableSubmit(accountId, methods.setError);

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;
  if (account && account.status !== "open") {
    return (
      <div className="flex flex-col gap-4">
        <SectionAnchor id="resumo">
          <AccountPayableSummary account={account} />
        </SectionAnchor>
        {account.status === "paid" && (
          <SectionAnchor id="comprovantes">
            <PaymentReceiptsSection accountId={account.id} />
          </SectionAnchor>
        )}
      </div>
    );
  }

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={accountsPayableUrl()}
      cancelLabel="Fechar"
      actions={account && <SettleAccountPayableDialog account={account} solid />}
      danger={account && <CancelAccountPayableButton accountId={account.id} description={account.description} />}
    >
      <SectionAnchor id="despesa">
        <HolderSection />
      </SectionAnchor>
      <SectionAnchor id="conta">
        <AmountsSection />
      </SectionAnchor>
    </RecordForm>
  );
}
