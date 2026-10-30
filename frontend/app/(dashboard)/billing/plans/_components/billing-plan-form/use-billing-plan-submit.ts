"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import {
  getBillingPlansListQueryKey,
  getBillingPlansRetrieveQueryKey,
  useBillingPlansCreate,
  useBillingPlansPartialUpdate,
} from "@/lib/api/generated";
import type { BillingPlan } from "@/lib/api/generated/models";
import { planErrorPath } from "@/lib/billing-plan-payload";
import { applyServerErrors } from "@/lib/form-errors";
import {
  billingPlanToPayload,
  type BillingPlanFormInput,
  type BillingPlanFormOutput,
} from "@/lib/schemas/billing-plan";
import { toast } from "@/lib/toast";

export const BILLING_PLANS_URL = "/billing/plans";

export function useBillingPlanSubmit(billingPlanId: string | undefined, setError: UseFormSetError<BillingPlanFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBillingPlansCreate();
  const updateMutation = useBillingPlansPartialUpdate();
  const isEdit = billingPlanId !== undefined;

  const done = (message: string, id: string) => {
    queryClient.invalidateQueries({ queryKey: getBillingPlansListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBillingPlansRetrieveQueryKey(id) });
    toast.success(message);
    router.push(BILLING_PLANS_URL);
  };
  // Os erros dos itens chegam como `items.<n>.<campo>` e os campos do formulário têm o mesmo caminho.
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError, planErrorPath));

  const submit = (values: BillingPlanFormOutput) => {
    const payload = billingPlanToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: billingPlanId, data: payload as Partial<BillingPlan> },
        { onSuccess: () => done("Plano de cobrança salvo.", billingPlanId), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as BillingPlan },
        { onSuccess: (created) => done("Plano de cobrança cadastrado.", created.id), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
