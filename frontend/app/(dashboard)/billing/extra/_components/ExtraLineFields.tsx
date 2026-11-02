"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SearchSelectField, TextField } from "@/components/form/fields";
import { FieldHint } from "@/components/form/FieldHint";
import { FieldRow } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import { useBillingEventsList, useCondominiumApportionmentCriteriaList, useCostCentersList } from "@/lib/api/generated";
import { defaultCostCenterId } from "@/lib/billing/billing-entry-payload";
import { formatCode } from "@/lib/format/format";
import { maskSignedMoney } from "@/lib/format/masks";
import { ALLOCATION_HINT, ALLOCATIONS } from "@/lib/schemas/billing-entry";
import type { ExtraBillingFormInput } from "@/lib/schemas/extra-billing";

import { SegmentedField } from "../../entries/_components/entry-form/SegmentedField";

interface ExtraLineFieldsProps {
  index: number;
  condominium: string;
  /** Ausente quando é a única linha: o boleto precisa de ao menos uma. */
  onRemove?: () => void;
}

/**
 * Uma linha do boleto extra: evento, descrição, rateio, sub-conta e valor, num bloco solto (sem fundo próprio), com o mesmo respiro entre os campos do resto
 * do formulário. Havendo mais de uma linha, ganha o cabeçalho "Valor N" com o "Remover".
 */
export function ExtraLineFields({ index, condominium, onRemove }: ExtraLineFieldsProps) {
  const { setValue, getValues } = useFormContext<ExtraBillingFormInput>();
  const prefix = `lines.${index}` as const;
  const [allocation, creditsCompany] = useWatch({ name: [`${prefix}.allocation`, `${prefix}.credits_company`] }) as [string, boolean];
  const { data: events } = useBillingEventsList({ active: true, limit: 100 });
  const { data: costCenters } = useCostCentersList({ condominium, active: true, limit: 100 }, { query: { enabled: condominium !== "" } });
  const { data: criteria } = useCondominiumApportionmentCriteriaList(
    { condominium, limit: 100 },
    { query: { enabled: condominium !== "" && allocation === "fraction" } }
  );
  const costCenterOptions = useMemo(() => costCenters?.results ?? [], [costCenters]);

  // A Conta Normal (código 0) já vem escolhida; trocar de condomínio refaz a escolha.
  useEffect(() => {
    const current = getValues(`${prefix}.cost_center`);
    if (!getValues(`${prefix}.credits_company`) && costCenterOptions.length > 0 && !costCenterOptions.some((item) => item.id === current)) {
      setValue(`${prefix}.cost_center`, defaultCostCenterId(costCenterOptions));
    }
  }, [costCenterOptions, getValues, prefix, setValue]);

  return (
    <li className="flex flex-col gap-5 py-6 first:pt-0 last:pb-0">
      {onRemove && (
        <div className="-mb-2 flex items-center justify-between gap-3">
          <h3 className="text-body font-medium">Valor {index + 1}</h3>
          <Button type="button" variant="ghost" size="sm" className="text-ink-soft" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remover
          </Button>
        </div>
      )}
      <FieldRow>
        <SearchSelectField
          name={`${prefix}.event`}
          label="Evento (opcional)"
          placeholder="Sem evento"
          onValueChange={(value) => {
            const event = events?.results.find((item) => item.id === value);
            setValue(`${prefix}.credits_company`, event?.credits_company ?? false);
            if (event?.credits_company) setValue(`${prefix}.cost_center`, "");
          }}
          options={(events?.results ?? []).map((item) => ({ value: item.id, label: `(${item.code}) ${item.name}` }))}
        />
        <TextField
          name={`${prefix}.description`}
          label="Descrição (opcional)"
          maxLength={120}
          placeholder="Ex.: Reparo do portão"
          autoComplete="off"
        />
      </FieldRow>
      <SegmentedField name={`${prefix}.allocation`} label="Rateio" hint={ALLOCATION_HINT} options={ALLOCATIONS} />
      {allocation === "fraction" && (
        <SearchSelectField
          name={`${prefix}.apportionment_criterion`}
          label="Critério de rateio"
          required
          placeholder="Selecione"
          hint="O total é dividido entre as unidades pela fração de cada uma neste critério; quem não tem fração não paga."
          options={(criteria?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      )}
      <FieldRow>
        {creditsCompany ? (
          <div className="flex flex-col">
            <span className="mb-1.5 flex items-center gap-1.5 text-caption font-medium text-ink-soft">
              Destino
              <FieldHint label="Destino">Este valor é da imobiliária: nunca entra na conta de um condomínio.</FieldHint>
            </span>
            <p className="flex h-9 items-center rounded-control bg-surface-muted px-3 text-body">Conta da imobiliária</p>
          </div>
        ) : (
          <SearchSelectField
            name={`${prefix}.cost_center`}
            label="Sub-conta"
            required
            placeholder={condominium ? "Selecione" : "Escolha o condomínio"}
            disabled={!condominium}
            hint="Onde o valor entra no extrato do condomínio quando o boleto é pago."
            options={costCenterOptions.map((item) => ({ value: item.id, label: `(${formatCode(item.code)}) ${item.name}` }))}
          />
        )}
        <TextField
          name={`${prefix}.amount`}
          label={allocation === "individual" ? "Valor por unidade (R$)" : "Total a ratear (R$)"}
          required
          inputMode="decimal"
          placeholder="0,00"
          mask={maskSignedMoney}
          hint="Use o sinal de menos (-) na frente para um desconto."
          autoComplete="off"
        />
      </FieldRow>
    </li>
  );
}
