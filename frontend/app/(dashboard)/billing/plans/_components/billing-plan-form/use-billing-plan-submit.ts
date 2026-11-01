"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import {
  getBillingPlansListQueryKey,
  getBillingPlansRetrieveQueryKey,
  useBillingPlansCreate,
  useBillingPlansDestroy,
  useBillingPlansPartialUpdate,
} from "@/lib/api/generated";
import type { BillingPlan } from "@/lib/api/generated/models";
import { planErrorPath } from "@/lib/billing/billing-plan-payload";
import { billingPlanUrl, billingPlansUrl, type BillingPlansScope } from "@/lib/billing/billing-plan-workspace";
import { apiErrorMessage } from "@/lib/errors/form-errors";
import { toast } from "@/lib/errors/toast";
import {
  billingPlanToPayload,
  type BillingPlanFormInput,
  type BillingPlanFormOutput,
} from "@/lib/schemas/billing-plan";

/** Salvar: editar fica na página; criar abre o plano novo ao lado da lista. Excluir volta à tela vazia dos planos. */
export function useBillingPlanSubmit(billingPlanId: string | undefined, scope: BillingPlansScope, setError: UseFormSetError<BillingPlanFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const destroyMutation = useBillingPlansDestroy();

  // Os erros dos itens chegam como `items.<n>.<campo>` e os campos do formulário têm o mesmo caminho.
  const { submit, isSubmitting } = useRecordSubmit<BillingPlanFormInput, BillingPlanFormOutput, BillingPlan>({
    recordId: billingPlanId,
    setError,
    errorPath: planErrorPath,
    toPayload: billingPlanToPayload,
    create: useBillingPlansCreate(),
    update: useBillingPlansPartialUpdate(),
    invalidate: (id) => [getBillingPlansListQueryKey(), getBillingPlansRetrieveQueryKey(id)],
    messages: { updated: "Plano de cobrança salvo.", created: "Plano de cobrança cadastrado." },
    redirect: (plan, created) => (created ? billingPlanUrl(plan.id, scope) : undefined),
  });

  const remove = () => {
    if (billingPlanId === undefined) return;
    destroyMutation.mutate(
      { id: billingPlanId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getBillingPlansListQueryKey() });
          toast.success("Plano de cobrança excluído.");
          router.push(billingPlansUrl(scope));
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Não foi possível excluir o plano.")),
      }
    );
  };

  return { submit, remove, isSubmitting };
}
