"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UseFormSetError } from "react-hook-form";

import {
  getCondominiumBillingRulesListQueryKey,
  getCondominiumsListQueryKey,
  getCondominiumsRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumBillingRulesCreate,
  useCondominiumBillingRulesPartialUpdate,
  useLateInterestRatesCreate,
  useCondominiumsCreate,
  useCondominiumsPartialUpdate,
} from "@/lib/api/generated";
import type { Condominium, CondominiumBillingRules, LateInterestRate } from "@/lib/api/generated/models";
import { apiErrorMessage, applyServerErrors } from "@/lib/form-errors";
import {
  billingRulesToPayload,
  condominiumToPayload,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";
import { toast } from "@/lib/toast";

import type { PendingInterestRate } from "./pending-interest-rate";

/**
 * Salva o condomínio e, em seguida, as regras de cobrança (outro recurso da API). `billingRulesId` é o
 * das regras já salvas; sem ele as regras são criadas.
 */
export function useCondominiumSubmit(
  condominiumId: string | undefined,
  billingRulesId: string | undefined,
  setError: UseFormSetError<CondominiumFormInput>,
  /** No condomínio novo: as taxas de juros escolhidas, gravadas depois dele (a taxa precisa do id do condomínio). */
  pendingRates: readonly PendingInterestRate[] = []
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCondominiumsCreate();
  const updateMutation = useCondominiumsPartialUpdate();
  const createRulesMutation = useCondominiumBillingRulesCreate();
  const updateRulesMutation = useCondominiumBillingRulesPartialUpdate();
  const createRateMutation = useLateInterestRatesCreate();
  const [isSavingRates, setIsSavingRates] = useState(false);
  const isEdit = condominiumId !== undefined;

  const invalidate = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getCondominiumsListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getCondominiumsRetrieveQueryKey(id) }),
      queryClient.invalidateQueries({ queryKey: getCondominiumBillingRulesListQueryKey() }),
    ]);

  const saveBillingRules = (condominium: string, values: CondominiumFormOutput) => {
    const data = billingRulesToPayload(values, condominium);
    return billingRulesId
      ? updateRulesMutation.mutateAsync({ id: billingRulesId, data })
      : createRulesMutation.mutateAsync({ data: data as unknown as CondominiumBillingRules });
  };

  const submit = async (values: CondominiumFormOutput) => {
    const payload = condominiumToPayload(values, isEdit);

    if (isEdit) {
      try {
        await updateMutation.mutateAsync({ id: condominiumId, data: payload as Partial<Condominium> });
        await saveBillingRules(condominiumId, values);
      } catch (error) {
        toast.error(applyServerErrors(error, setError));
        return;
      }
      void invalidate(condominiumId);
      toast.success("Condomínio salvo.");
      router.push("/condominiums");
      return;
    }

    let created: Condominium;
    try {
      created = await createMutation.mutateAsync({ data: payload as unknown as Condominium });
    } catch (error) {
      toast.error(applyServerErrors(error, setError));
      return;
    }
    // O condomínio já existe: o que falhar daqui para a frente não o desfaz, e seguir para a edição evita cadastrá-lo duas vezes ao tentar de novo.
    const failures: string[] = [];
    try {
      await saveBillingRules(created.id, values);
    } catch (error) {
      failures.push(`as regras de cobrança (${apiErrorMessage(error, "salve-as pela edição do condomínio")})`);
    }
    setIsSavingRates(true);
    for (const rate of pendingRates) {
      try {
        await createRateMutation.mutateAsync({
          data: { condominium: created.id, start_date: rate.start_date, monthly_percentage: rate.monthly_percentage } as LateInterestRate,
        });
      } catch (error) {
        failures.push(`a taxa de juros a partir de ${rate.start_date.split("-").reverse().join("/")} (${apiErrorMessage(error, "cadastre-a pela edição do condomínio")})`);
      }
    }
    setIsSavingRates(false);
    void invalidate(created.id);
    if (failures.length > 0) {
      toast.error(`Condomínio cadastrado, mas não foram salvos: ${failures.join("; ")}.`);
      router.push(`/condominiums/${created.id}`);
      return;
    }
    toast.success(pendingRates.length > 0 ? "Condomínio cadastrado com as taxas de juros." : "Condomínio cadastrado.");
    router.push(`/condominiums/${created.id}/units`);
  };

  return {
    submit,
    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      createRulesMutation.isPending ||
      updateRulesMutation.isPending ||
      isSavingRates,
  };
}
