"use client";

import { useFormContext } from "react-hook-form";

import { SearchSelectField, TextField } from "@/components/form/fields";
import { FormSection } from "@/components/form/FormSection";
import { useCondominiumsList } from "@/lib/api/generated";

/**
 * Condomínio (só no cadastro: o de um plano existente não muda) e nome. Trocar o condomínio limpa
 * a sub-conta e o modelo de cada item, que pertencem ao condomínio anterior.
 */
export function IdentificationSection({ isEdit }: { isEdit: boolean }) {
  const { getValues, setValue } = useFormContext();
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const clearItemPickers = () => {
    const items = (getValues("items") as unknown[] | undefined) ?? [];
    items.forEach((_, index) => {
      setValue(`items.${index}.cost_center`, "", { shouldDirty: true });
      setValue(`items.${index}.entry_template`, "", { shouldDirty: true });
    });
  };

  return (
    <FormSection title="Identificação">
      <SearchSelectField
        name="condominium"
        label="Condomínio"
        required
        disabled={isEdit}
        placeholder="Selecione"
        hint={isEdit ? "O condomínio de um plano não pode ser alterado." : undefined}
        onValueChange={clearItemPickers}
        options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
      />
      <TextField name="name" label="Nome do plano" required maxLength={120} placeholder="Ex.: Taxa ordinária" autoComplete="off" />
    </FormSection>
  );
}
