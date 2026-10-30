"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

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
import { apiErrorMessage, applyServerErrors } from "@/lib/errors/form-errors";
import {
  billingPlanToPayload,
  type BillingPlanFormInput,
  type BillingPlanFormOutput,
} from "@/lib/schemas/billing-plan";
import { toast } from "@/lib/errors/toast";

/** Salvar: editar fica na página; criar abre o plano novo ao lado da lista. Excluir volta à tela vazia dos planos. */
export function useBillingPlanSubmit(billingPlanId: string | undefined, scope: BillingPlansScope, setError: UseFormSetError<BillingPlanFormInput>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBillingPlansCreate();
  const updateMutation = useBillingPlansPartialUpdate();
  const destroyMutation = useBillingPlansDestroy();
  const isEdit = billingPlanId !== undefined;

  const refresh = (id: string) => {
    queryClient.invalidateQueries({ queryKey: getBillingPlansListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBillingPlansRetrieveQueryKey(id) });
  };
  // Os erros dos itens chegam como `items.<n>.<campo>` e os campos do formulário têm o mesmo caminho.
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError, planErrorPath));

  const submit = (values: BillingPlanFormOutput) => {
    const payload = billingPlanToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: billingPlanId, data: payload as Partial<BillingPlan> },
        {
          onSuccess: () => {
            refresh(billingPlanId);
            toast.success("Plano de cobrança salvo.");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as BillingPlan },
        {
          onSuccess: (created) => {
            refresh(created.id);
            toast.success("Plano de cobrança cadastrado.");
            router.push(billingPlanUrl(created.id, scope));
          },
          onError,
        }
      );
    }
  };

  const remove = () => {
    if (!isEdit) return;
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

  return { submit, remove, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
