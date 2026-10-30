"use client";

import { useEffect, useState } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { SearchSelectField, SelectField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { SCOPE_SELECT_MAX_RESULTS } from "@/components/ScopeSelect";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCondominiumsList, useCostCentersList, useEntryTemplatesList, useSuppliersList, useSuppliersRetrieve } from "@/lib/api/generated";
import type { Supplier } from "@/lib/api/generated/models";
import { formattedPersonDocument } from "@/lib/person-document";
import { PAYABLE_HOLDERS } from "@/lib/schemas/account-payable";

import { NewSupplierDialog } from "./NewSupplierDialog";

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
  // Fornecedores podem ser muitos: a busca vai ao servidor e a lista mostra poucos; o da conta aberta entra sempre, para o campo mostrar o nome dele.
  const supplier = useWatch({ name: "supplier" }) as string;
  const [supplierSearch, setSupplierSearch] = useState("");
  const supplierTerm = useDebouncedValue(supplierSearch.trim());
  const { data: suppliers } = useSuppliersList({ ...(supplierTerm ? { query: supplierTerm } : {}), limit: SCOPE_SELECT_MAX_RESULTS });
  const { data: currentSupplier } = useSuppliersRetrieve(supplier, { query: { enabled: supplier !== "" } });
  const supplierRows: Supplier[] = [...(suppliers?.results ?? [])];
  if (currentSupplier && !supplierRows.some((item) => item.id === currentSupplier.id)) supplierRows.unshift(currentSupplier);

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
        <div className="flex items-end gap-2">
          <SearchSelectField
            name="supplier"
            label="Fornecedor"
            required
            placeholder="Busque por nome ou documento"
            className="min-w-0 flex-1"
            onSearch={setSupplierSearch}
            options={supplierRows.map((item) => ({
              value: item.id,
              label: [item.person_detail.name, formattedPersonDocument(item.person_detail)].filter(Boolean).join(" · "),
            }))}
          />
          <NewSupplierDialog onCreated={(id) => setValue("supplier", id, { shouldDirty: true, shouldValidate: true })} />
        </div>
      </FieldRow>
      {isCondominiumExpense && (
        <>
          <SearchSelectField
            name="condominium"
            label="Condomínio"
            required
            placeholder="Selecione"
            options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: `${String(item.code).padStart(4, "0")} · ${item.name}` }))}
          />
          <FieldRow>
            <SearchSelectField
              name="cost_center"
              label="Sub-conta"
              required
              placeholder={condominium ? "Selecione" : "Escolha o condomínio primeiro"}
              disabled={!condominium}
              onValueChange={() => setValue("entry_template", "", { shouldDirty: true })}
              options={(costCenters?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
            <SearchSelectField
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
