"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SelectField, TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { useCondominiumsList, useCostCentersList } from "@/lib/api/generated";
import { defaultCostCenterId, formatCode, needsFractionNumber, needsInstallments } from "@/lib/billing-entry-payload";
import { maskMonthYear } from "@/lib/billing-plan-payload";
import { maskMoney } from "@/lib/masks";
import {
  ALLOCATION_HINT,
  ALLOCATIONS,
  IDEAL_FRACTION_OPTIONS,
  RECURRENCES,
  type BillingEntryFormInput,
} from "@/lib/schemas/billing-entry";

import { EventPicker } from "./EventPicker";
import { SegmentedField } from "./SegmentedField";
import { UnitsPicker } from "./UnitsPicker";

/** O formulário "Novo lançamento": condomínio e mês, evento e descrição, rateio, recorrência, sub-conta, valor e unidades. */
export function EntryFormFields() {
  const { setValue, getValues } = useFormContext<BillingEntryFormInput>();
  const [condominium, allocation, recurrence, costCenter] = useWatch({
    name: ["condominium", "allocation", "recurrence", "cost_center"],
  });
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: costCenters } = useCostCentersList({ condominium, active: true, limit: 100 }, { query: { enabled: condominium !== "" } });
  const costCenterOptions = [...(costCenters?.results ?? [])].sort((a, b) => (a.code ?? 0) - (b.code ?? 0));

  // A Conta Normal (código 0) já vem escolhida; trocar de condomínio refaz a escolha e a seleção de unidades.
  useEffect(() => {
    if (costCenterOptions.length > 0 && !costCenterOptions.some((item) => item.id === getValues("cost_center"))) {
      setValue("cost_center", defaultCostCenterId(costCenterOptions));
    }
  }, [costCenterOptions, getValues, setValue]);

  return (
    <div className="space-y-3">
      <SelectField
        name="condominium"
        label="Condomínio"
        required
        placeholder="Selecione"
        onValueChange={() => {
          setValue("units", [], { shouldDirty: true });
          setValue("cost_center", "");
        }}
        options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))}
      />
      <FieldRow>
        <TextField
          name="start_month"
          label="Referência (mês de início)"
          required
          inputMode="numeric"
          placeholder="MM/AAAA"
          maxLength={7}
          mask={maskMonthYear}
          autoComplete="off"
        />
      </FieldRow>
      <EventPicker />
      <TextField
        name="description"
        label="Descrição (opcional)"
        maxLength={120}
        placeholder="Ex.: 10/2026"
        hint="Vem depois do nome do evento no boleto: Limpeza do condomínio - 10/2026."
        autoComplete="off"
      />
      <SegmentedField name="allocation" label="Rateio" hint={ALLOCATION_HINT} options={ALLOCATIONS} />
      {needsFractionNumber(allocation) && (
        <SelectField name="ideal_fraction_number" label="Fração ideal" required placeholder="Selecione" options={IDEAL_FRACTION_OPTIONS} />
      )}
      <SegmentedField name="recurrence" label="Recorrência" options={RECURRENCES} />
      {needsInstallments(recurrence) && (
        <TextField name="installments_total" label="Parcelas" required inputMode="numeric" maxLength={3} placeholder="Ex.: 12" autoComplete="off" />
      )}
      <FieldRow>
        <SelectField
          name="cost_center"
          label="Sub-conta"
          required
          placeholder={condominium ? "Selecione" : "Escolha o condomínio"}
          disabled={!condominium}
          hint="Onde o valor entra no extrato do condomínio quando o boleto é pago."
          options={costCenterOptions.map((item) => ({ value: item.id, label: `(${formatCode(item.code)}) ${item.name}` }))}
        />
        <TextField
          name="amount"
          label={allocation === "individual" ? "Valor por unidade (R$)" : "Total a ratear (R$)"}
          required
          inputMode="decimal"
          placeholder="0,00"
          mask={maskMoney}
          autoComplete="off"
        />
      </FieldRow>
      {costCenter === "" && condominium !== "" && costCenterOptions.length === 0 && (
        <p className="text-caption text-danger">Este condomínio ainda não tem sub-contas: cadastre uma em Configurações → Sub-contas.</p>
      )}
      <UnitsPicker condominium={condominium} />
    </div>
  );
}
