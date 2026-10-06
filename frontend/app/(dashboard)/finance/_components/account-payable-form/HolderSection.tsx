"use client";

import { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { SelectField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useCondominiumsList, useCostCentersList, useEntryTemplatesList, useSuppliersList } from "@/lib/api/generated";
import { PAYABLE_HOLDERS } from "@/lib/schemas/account-payable";

/** De quem é a despesa (condomínio ou empresa), sua sub-conta, o modelo de lançamento e o fornecedor. */
export function HolderSection() {
  const { setValue } = useFormContext();
  const holder = useWatch({ name: "holder" }) as string;
  const condominium = useWatch({ name: "condominium" }) as string;
  const costCenter = useWatch({ name: "cost_center" }) as string;
  const { dirtyFields } = useFormState();
  const isCondominiumExpense = holder === "condominium";

  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: costCenters } = useCostCentersList(
    { condominium, active: true, limit: 100 },
    { query: { enabled: isCondominiumExpense && condominium !== "" } }
  );
  const { data: entryTemplates } = useEntryTemplatesList(
    { cost_center: costCenter, active: true, limit: 100 },
    { query: { enabled: isCondominiumExpense && costCenter !== "" } }
  );
  const { data: suppliers } = useSuppliersList({ limit: 100 });

  // Trocar o condomínio (ou a sub-conta) invalida o que dependia dele; só quando o usuário muda, não ao carregar.
  useEffect(() => {
    if (dirtyFields.condominium) {
      setValue("cost_center", "", { shouldDirty: true });
      setValue("entry_template", "", { shouldDirty: true });
    }
  }, [condominium, dirtyFields.condominium, setValue]);

  return (
    <FormSection title="Despesa" description="A sub-conta define onde o pagamento aparece no extrato.">
      <FieldRow>
        <SelectField name="holder" label="Tipo de despesa" required options={PAYABLE_HOLDERS} />
        <SelectField
          name="supplier"
          label="Fornecedor"
          required
          placeholder="Selecione"
          options={(suppliers?.results ?? []).map((item) => ({ value: item.id, label: item.person_detail.name }))}
        />
      </FieldRow>
      {isCondominiumExpense && (
        <>
          <SelectField
            name="condominium"
            label="Condomínio"
            required
            placeholder="Selecione"
            options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
          />
          <FieldRow>
            <SelectField
              name="cost_center"
              label="Sub-conta"
              required
              placeholder={condominium ? "Selecione" : "Escolha o condomínio primeiro"}
              disabled={!condominium}
              onValueChange={() => setValue("entry_template", "", { shouldDirty: true })}
              options={(costCenters?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
            <SelectField
              name="entry_template"
              label="Modelo de lançamento"
              placeholder={costCenter ? "Selecione" : "Escolha a sub-conta primeiro"}
              disabled={!costCenter}
              hint="Obrigatório para dar a baixa: define como o pagamento é lançado no extrato."
              options={(entryTemplates?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
          </FieldRow>
        </>
      )}
    </FormSection>
  );
}
