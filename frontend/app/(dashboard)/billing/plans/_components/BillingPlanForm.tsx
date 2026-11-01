"use client";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

import { FormSkeleton } from "@/components/form/FormSkeleton";

import { useBillingPlansRetrieve } from "@/lib/api/generated";
import { billingPlansUrl } from "@/lib/billing/billing-plan-workspace";
import { throwIfPageError } from "@/lib/query/page-error";
import { BILLING_PLAN_DEFAULTS, billingPlanSchema, billingPlanToForm } from "@/lib/schemas/billing-plan";

import { IdentificationSection } from "./billing-plan-form/IdentificationSection";
import { ItemsSection } from "./billing-plan-form/ItemsSection";
import { useBillingPlanSubmit } from "./billing-plan-form/use-billing-plan-submit";
import { usePlansScope } from "./use-plans-scope";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de um plano de cobrança com os seus itens (a lista inteira é enviada junto). No cadastro o condomínio da lista já vem escolhido. */
export function BillingPlanForm({ billingPlanId }: { billingPlanId?: string }) {
  const scope = usePlansScope();
  const isEdit = billingPlanId !== undefined;
  const { data: plan, isLoading, error: loadError } = useBillingPlansRetrieve(billingPlanId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

  const methods = useRecordForm({
    schema: billingPlanSchema,
    defaults: { ...BILLING_PLAN_DEFAULTS, condominium: scope.condominium },
    record: plan,
    toForm: billingPlanToForm,
  });
  const { submit, remove, isSubmitting } = useBillingPlanSubmit(billingPlanId, scope, methods.setError);

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={billingPlansUrl(scope)}
      danger={
        plan && (
          <ConfirmDeleteButton
            appearance="solid"
            title="Excluir plano de cobrança?"
            description={`O plano "${plan.name}" e os seus ${plan.items.length} itens serão excluídos. Esta ação não pode ser desfeita.`}
            onConfirm={remove}
          />
        )
      }
    >
      <SectionAnchor id="plano">
        <IdentificationSection isEdit={isEdit} />
      </SectionAnchor>
      <SectionAnchor id="itens">
        <ItemsSection />
      </SectionAnchor>
    </RecordForm>
  );
}
