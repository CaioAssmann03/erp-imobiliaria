"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { SearchSelectField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { Button } from "@/components/ui/button";
import {
  useBillingEventsList,
  useCondominiumApportionmentCriteriaList,
  useCostCentersList,
  useEntryTemplatesList,
} from "@/lib/api/generated";
import { needsAmount, needsApportionmentCriterion, needsUnitValueField } from "@/lib/billing-plan-payload";
import { maskMoney } from "@/lib/masks";
import { CALCULATION_KINDS, UNIT_VALUE_FIELDS } from "@/lib/schemas/billing-plan";

interface BillingPlanItemFieldsProps {
  index: number;
  condominium: string;
  isFirst: boolean;
  isLast: boolean;
  canRemove: boolean;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}

/** Um item do plano: descrição, sub-conta e modelo (do condomínio do plano) e o tipo de cálculo com só os seus campos. */
export function BillingPlanItemFields({ index, condominium, isFirst, isLast, canRemove, onMove, onRemove }: BillingPlanItemFieldsProps) {
  const { setValue } = useFormContext();
  const prefix = `items.${index}`;
  const [costCenter, kind, event] = useWatch({
    name: [`${prefix}.cost_center`, `${prefix}.calculation_kind`, `${prefix}.event`],
  }) as [string, string, string];
  const { data: events } = useBillingEventsList({ active: true, limit: 100 });

  const { data: costCenters } = useCostCentersList({ condominium, active: true, limit: 100 });
  const { data: entryTemplates } = useEntryTemplatesList(
    { cost_center: costCenter, active: true, limit: 100 },
    { query: { enabled: costCenter !== "" } }
  );
  const { data: criteria } = useCondominiumApportionmentCriteriaList(
    { condominium, limit: 100 },
    { query: { enabled: needsApportionmentCriterion(kind) } }
  );
  const label = `item ${index + 1}`;

  return (
    <div className="space-y-3 rounded-panel bg-surface-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-caption font-medium uppercase tracking-wide text-ink-soft">Item {index + 1}</h3>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={isFirst} aria-label={`Mover ${label} para cima`} onClick={() => onMove(-1)}>
            <ChevronUp className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={isLast} aria-label={`Mover ${label} para baixo`} onClick={() => onMove(1)}>
            <ChevronDown className="size-4" />
          </Button>
          {canRemove && (
            <Button type="button" variant="ghost" size="sm" className="text-ink-soft hover:text-danger" aria-label={`Remover ${label}`} onClick={onRemove}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <FieldRow>
        <SearchSelectField
          name={`${prefix}.event`}
          label="Evento"
          placeholder="Sem evento"
          hint="O boleto abre a linha com o código e o nome do evento (0052-CONDOMINIO). Cadastre os eventos em Configurações."
          options={(events?.results ?? [])
            .filter((item) => !item.credits_company)
            .map((item) => ({ value: item.id, label: `(${item.code}) ${item.name}` }))}
        />
        <TextField
          name={`${prefix}.description`}
          label="Descrição no boleto"
          required={!event}
          maxLength={120}
          hint="Vem depois do evento; sem evento, é a linha inteira."
          autoComplete="off"
        />
      </FieldRow>
      <FieldRow>
        <SearchSelectField
          name={`${prefix}.cost_center`}
          label="Sub-conta"
          required
          placeholder="Selecione"
          onValueChange={() => setValue(`${prefix}.entry_template`, "", { shouldDirty: true })}
          options={(costCenters?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
        <SearchSelectField
          name={`${prefix}.entry_template`}
          label="Modelo de lançamento"
          required
          placeholder={costCenter ? "Selecione" : "Escolha a sub-conta"}
          disabled={!costCenter}
          options={(entryTemplates?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      </FieldRow>
      <FieldRow>
        <SelectField name={`${prefix}.calculation_kind`} label="Cálculo" required options={CALCULATION_KINDS} />
        {needsAmount(kind) && (
          <TextField
            name={`${prefix}.amount`}
            label={needsApportionmentCriterion(kind) ? "Total do condomínio (R$)" : "Valor por unidade (R$)"}
            required
            inputMode="numeric"
            placeholder="0,00"
            mask={(value) => maskMoney(value, 12)}
          />
        )}
        {needsUnitValueField(kind) && (
          <SelectField name={`${prefix}.unit_value_field`} label="Valor lido da unidade" required placeholder="Selecione" options={UNIT_VALUE_FIELDS} />
        )}
      </FieldRow>
      {needsApportionmentCriterion(kind) && (
        <SearchSelectField
          name={`${prefix}.apportionment_criterion`}
          label="Critério de rateio"
          required
          placeholder="Selecione"
          hint="O total é dividido entre as unidades pela fração de cada uma neste critério, que precisa fechar em 1."
          options={(criteria?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />
      )}
    </div>
  );
}
