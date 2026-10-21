"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { billingExample, type CompetenceMonth, type DueMonth } from "@/lib/billing-example";
import { maskDecimal, maskInteger, maskMoney } from "@/lib/masks";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

import { InterestRatesCard } from "./InterestRatesCard";

const money = (value: string) => maskMoney(value, 10);
const percent = (value: string) => maskDecimal(value, 2, 3);
const lateFee = (value: string) => maskDecimal(value, 2, 1); // até 2%: um dígito inteiro
const days = (value: string) => maskInteger(value, 3);
const dayOfMonth = (value: string) => maskInteger(value, 2);

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Cobrança do condomínio: vencimento, competência, multa e juros por atraso, boleto, desconto. */
export function BillingSection({ condominiumId }: { condominiumId?: string }) {
  const { control } = useFormContext<CondominiumFormInput>();
  const [dueMonth, competenceMonth, hasInitialLateFee] = useWatch({
    control,
    name: ["due_month", "competence_month", "has_initial_late_fee"],
  });

  return (
    <>
      <FormSection
        title="Vencimento e competência"
        description="A referência é o mês a que a emissão se refere."
      >
        <FieldRow>
          <TextField
            name="due_day"
            label="Dia de vencimento"
            mask={dayOfMonth}
            inputMode="numeric"
            hint="De 1 a 28."
          />
          <SelectField
            name="due_month"
            label="Vencimento no mês"
            options={[
              { value: "reference", label: "Mês da referência" },
              { value: "following", label: "Mês seguinte à referência" },
            ]}
          />
        </FieldRow>
        <FieldRow>
          <SelectField
            name="competence_month"
            label="Competência do boleto"
            options={[
              { value: "same_as_due", label: "Mesmo mês do vencimento" },
              { value: "before_due", label: "Mês anterior ao vencimento" },
            ]}
          />
          <CheckboxField name="due_on_business_day" label="Vencimento por dia útil" />
        </FieldRow>
        <FieldRow>
          <TextField
            name="issuance_day"
            label="Dia de emissão"
            mask={dayOfMonth}
            inputMode="numeric"
            hint="De 1 a 28. O dia do mês em que os boletos são emitidos."
          />
          <CheckboxField name="exempts_manager_unit" label="Isentar a unidade do síndico" />
        </FieldRow>
        <p className="rounded-panel bg-surface-muted px-4 py-2.5 text-body text-ink-soft" role="note">
          {billingExample(currentMonth(), dueMonth as DueMonth, competenceMonth as CompetenceMonth)}
        </p>
      </FormSection>

      <FormSection title="Multa por atraso" description="Até 2%, o limite do Código Civil para condomínio.">
        <FieldRow>
          <TextField
            name="late_fee_percentage"
            label="Multa (%)"
            mask={lateFee}
            inputMode="decimal"
            placeholder="0,00"
            hint="0: sem multa."
          />
          <CheckboxField
            name="has_initial_late_fee"
            label="Percentual diferente nos primeiros dias"
          />
        </FieldRow>
        {hasInitialLateFee && (
          <FieldRow>
            <TextField
              name="initial_late_fee_percentage"
              label="Multa nos primeiros dias (%)"
              required
              mask={lateFee}
              inputMode="decimal"
              placeholder="0,00"
            />
            <TextField
              name="initial_late_fee_days"
              label="Primeiros dias de atraso"
              required
              mask={days}
              inputMode="numeric"
              hint="Pagando dentro desse prazo, vale este percentual."
            />
          </FieldRow>
        )}
      </FormSection>

      <FormSection
        title="Juros por atraso"
        description="Taxa ao mês a partir de uma data. Sem taxa cadastrada, o condomínio não cobra juros."
      >
        <FieldRow>
          <SelectField
            name="interest_calculation"
            label="Tipo de cálculo"
            options={[
              { value: "full_month", label: "Inteiro (mês cheio desde o 1º dia de atraso)" },
              { value: "per_day", label: "Por dia (proporcional aos dias de atraso)" },
            ]}
          />
          <TextField
            name="interest_grace_days"
            label="Carência (dias)"
            mask={days}
            inputMode="numeric"
            hint="0: cobra desde o dia seguinte ao vencimento."
          />
        </FieldRow>
        <InterestRatesCard condominiumId={condominiumId} />
      </FormSection>

      <FormSection title="Prestação de contas">
        <FieldRow>
          <CheckboxField name="should_show_qr_code" label="Exibir QR Code no boleto" />
          <CheckboxField name="should_show_fee_statement" label="Exibir demonstrativo de taxas" />
        </FieldRow>
      </FormSection>

      <FormSection title="Desconto e limite">
        <FieldRow columns={3}>
          <TextField
            name="credit_limit"
            label="Limite de crédito (R$)"
            mask={money}
            inputMode="numeric"
            placeholder="0,00"
          />
          <TextField
            name="early_payment_discount_percentage"
            label="Desconto em dia (%)"
            mask={percent}
            inputMode="decimal"
            placeholder="0,00"
          />
          <TextField
            name="early_payment_discount_days"
            label="Dias antes do venc."
            mask={dayOfMonth}
            inputMode="numeric"
            hint="Prazo do desconto."
          />
        </FieldRow>
      </FormSection>
    </>
  );
}
