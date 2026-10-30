"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { MonthField, SearchSelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { useCondominiumApportionmentCriteriaList, useCondominiumsList, useCostCentersList } from "@/lib/api/generated";
import { defaultCostCenterId, formatCode, needsApportionmentCriterion, needsInstallments } from "@/lib/billing-entry-payload";
import { maskSignedMoney } from "@/lib/masks";
import {
  ALLOCATION_HINT,
  ALLOCATIONS,
  RECURRENCES,
  type BillingEntryFormInput,
} from "@/lib/schemas/billing-entry";

import { EventPicker } from "./EventPicker";
import { SegmentedField } from "./SegmentedField";
import { UnitsPicker } from "./UnitsPicker";

/** A seção "Lançamento": o condomínio (o da lista ao lado, só para conferir), o mês de início, o evento e a descrição do boleto. */
export function EntryIdentitySection() {
  const condominium = useWatch({ name: "condominium" }) as string;
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const chosen = condominiums?.results.find((item) => item.id === condominium);

  return (
    <FormSection title="Lançamento" description="O que entra no boleto e a partir de que mês.">
      <FieldRow>
        <div className="flex flex-col">
          <span className="mb-1.5 text-caption font-medium text-ink-soft">Condomínio</span>
          <p className="flex h-9 items-center truncate rounded-control bg-surface-muted px-3 text-body">
            {chosen ? `${formatCode(chosen.code)} · ${chosen.name}` : "…"}
          </p>
        </div>
        <MonthField
          name="start_month"
          label="Referência (mês de início)"
          required
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
    </FormSection>
  );
}

/** A seção "Rateio e valor": o rateio, a recorrência, a sub-conta de destino e o valor. */
export function EntryAmountSection() {
  const { setValue, getValues } = useFormContext<BillingEntryFormInput>();
  const [condominium, allocation, recurrence, costCenter, creditsCompany] = useWatch({
    name: ["condominium", "allocation", "recurrence", "cost_center", "credits_company"],
  });
  const { data: costCenters } = useCostCentersList({ condominium, active: true, limit: 100 }, { query: { enabled: condominium !== "" } });
  const { data: criteria } = useCondominiumApportionmentCriteriaList(
    { condominium, limit: 100 },
    { query: { enabled: condominium !== "" && needsApportionmentCriterion(allocation) } }
  );
  const costCenterOptions = [...(costCenters?.results ?? [])].sort((a, b) => (a.code ?? 0) - (b.code ?? 0));

  // A Conta Normal (código 0) já vem escolhida.
  useEffect(() => {
    if (!getValues("credits_company") && costCenterOptions.length > 0 && !costCenterOptions.some((item) => item.id === getValues("cost_center"))) {
      setValue("cost_center", defaultCostCenterId(costCenterOptions));
    }
  }, [costCenterOptions, getValues, setValue]);

  return (
    <FormSection title="Rateio e valor" description="Como o valor se divide entre as unidades e onde ele entra no extrato.">
      <SegmentedField name="allocation" label="Rateio" hint={ALLOCATION_HINT} options={ALLOCATIONS} />
      {needsApportionmentCriterion(allocation) && (
        <SearchSelectField
          name="apportionment_criterion"
          label="Critério de rateio"
          required
          placeholder="Selecione"
          hint="O total é dividido entre as unidades selecionadas pela fração de cada uma neste critério."
          options={(criteria?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      )}
      <SegmentedField name="recurrence" label="Recorrência" options={RECURRENCES} />
      {needsInstallments(recurrence) && (
        <TextField name="installments_total" label="Parcelas" required inputMode="numeric" maxLength={3} placeholder="Ex.: 12" autoComplete="off" />
      )}
      <FieldRow>
        {creditsCompany ? (
          <div className="flex flex-col">
            <span className="mb-1.5 text-caption font-medium text-ink-soft">Destino</span>
            <p className="flex h-9 items-center rounded-control bg-surface-muted px-3 text-body">Conta da imobiliária</p>
            <p className="mt-1.5 text-caption text-ink-soft">Este valor é da imobiliária: nunca entra na conta de um condomínio.</p>
          </div>
        ) : (
          <SearchSelectField
            name="cost_center"
            label="Sub-conta"
            required
            placeholder="Selecione"
            hint="Onde o valor entra no extrato do condomínio quando o boleto é pago."
            options={costCenterOptions.map((item) => ({ value: item.id, label: `(${formatCode(item.code)}) ${item.name}` }))}
          />
        )}
        <TextField
          name="amount"
          label={allocation === "individual" ? "Valor por unidade (R$)" : "Total a ratear (R$)"}
          required
          inputMode="decimal"
          placeholder="0,00"
          mask={maskSignedMoney}
          hint="Use o sinal de menos (-) na frente para um desconto."
          autoComplete="off"
        />
      </FieldRow>
      {!creditsCompany && costCenter === "" && costCenterOptions.length === 0 && (
        <p className="text-caption text-danger">Este condomínio ainda não tem sub-contas: cadastre uma em Configurações → Sub-contas.</p>
      )}
    </FormSection>
  );
}

/** A seção "Unidades": quais pagam e, no rateio individual, o valor próprio de cada uma. */
export function EntryUnitsSection() {
  const condominium = useWatch({ name: "condominium" }) as string;

  return (
    <FormSection title="Unidades" description="Marque as unidades que pagam este valor.">
      <UnitsPicker condominium={condominium} />
    </FormSection>
  );
}
