"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getCondominiumBillingRulesListQueryKey,
  getCondominiumsListQueryKey,
  getCondominiumsRetrieveQueryKey,
  getDashboardRetrieveQueryKey,
  useCondominiumBillingRulesCreate,
  useCondominiumBillingRulesPartialUpdate,
  useCondominiumsCreate,
  useCondominiumsPartialUpdate,
} from "@/lib/api/generated";
import type { Condominium, CondominiumBillingRules } from "@/lib/api/generated/models";
import { apiErrorMessage, applyServerErrors } from "@/lib/form-errors";
import {
  billingRulesToPayload,
  condominiumToPayload,
  type CondominiumFormInput,
  type CondominiumFormOutput,
} from "@/lib/schemas/condominium";

/**
 * Salva o condomínio e, em seguida, as regras de cobrança (outro recurso da API). `billingRulesId` é o
 * das regras já salvas; sem ele as regras são criadas.
 */
export function useCondominiumSubmit(
  condominiumId: string | undefined,
  billingRulesId: string | undefined,
  setError: UseFormSetError<CondominiumFormInput>
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCondominiumsCreate();
  const updateMutation = useCondominiumsPartialUpdate();
  const createRulesMutation = useCondominiumBillingRulesCreate();
  const updateRulesMutation = useCondominiumBillingRulesPartialUpdate();
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
    try {
      await saveBillingRules(created.id, values);
    } catch (error) {
      // O condomínio já existe: seguir para a edição evita cadastrá-lo duas vezes ao tentar de novo.
      void invalidate(created.id);
      toast.error(
        `Condomínio cadastrado, mas as regras de cobrança não foram salvas. ${apiErrorMessage(error, "Salve-as pela edição do condomínio.")}`
      );
      router.push(`/condominiums/${created.id}`);
      return;
    }
    void invalidate(created.id);
    toast.success("Condomínio cadastrado.");
    router.push(`/condominiums/${created.id}/units`);
  };

  return {
    submit,
    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      createRulesMutation.isPending ||
      updateRulesMutation.isPending,
  };
}
