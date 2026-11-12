"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { CheckboxField, MonthField, SearchSelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useCondominiumsList } from "@/lib/api/generated";
import { newBillingPlanUrl } from "@/lib/billing/billing-plan-workspace";

import { usePlansScope } from "../use-plans-scope";

/**
 * O plano em si: o condomínio (só no cadastro: o de um plano existente não muda e já está no título), o nome, a vigência e se está ativo. Trocar o
 * condomínio limpa a sub-conta e o modelo de cada item, que pertencem ao condomínio anterior. No cadastro o campo e o condomínio da lista da esquerda andam
 * juntos pela URL (`?condominium=`): escolher aqui a escreve (a lista a lê); escolher lá (inclusive *Todos os condomínios*, que esvazia o campo) a escreve e o campo a lê.
 */
export function IdentificationSection({ isEdit }: { isEdit: boolean }) {
  const router = useRouter();
  const scope = usePlansScope();
  const { getValues, setValue } = useFormContext();
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const clearItemPickers = useCallback(() => {
    const items = (getValues("items") as unknown[] | undefined) ?? [];
    items.forEach((_, index) => {
      setValue(`items.${index}.cost_center`, "", { shouldDirty: true });
      setValue(`items.${index}.entry_template`, "", { shouldDirty: true });
    });
  }, [getValues, setValue]);

  // A lista da esquerda escolheu outro condomínio: o campo o segue (só no cadastro; o de um plano existente não muda).
  useEffect(() => {
    if (isEdit || scope.condominium === getValues("condominium")) return;
    setValue("condominium", scope.condominium, { shouldDirty: true, shouldValidate: true });
    clearItemPickers();
  }, [isEdit, scope.condominium, getValues, setValue, clearItemPickers]);

  const nameField = <TextField name="name" label="Nome do plano" required maxLength={120} placeholder="Ex.: Taxa ordinária" autoComplete="off" />;

  return (
    <FormSection title="Plano" hint="A emissão de um mês usa os planos ativos cuja vigência inclui o mês. Sem meses, o plano vale sempre que estiver ativo.">
      {isEdit ? (
        nameField
      ) : (
        <FieldRow>
          <SearchSelectField
            name="condominium"
            label="Condomínio"
            required
            placeholder="Selecione"
            onValueChange={(condominium) => {
              clearItemPickers();
              router.replace(newBillingPlanUrl({ condominium }));
            }}
            options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
          {nameField}
        </FieldRow>
      )}
      <FieldRow columns={3}>
        <MonthField name="start_month" label="Mês inicial" hint="Mês/ano em que o plano começa a valer. Em branco: desde sempre." />
        <MonthField name="end_month" label="Mês final" hint="Último mês em que vale. Em branco: sem data para acabar." />
        <CheckboxField name="active" label="Plano ativo" />
      </FieldRow>
    </FormSection>
  );
}
