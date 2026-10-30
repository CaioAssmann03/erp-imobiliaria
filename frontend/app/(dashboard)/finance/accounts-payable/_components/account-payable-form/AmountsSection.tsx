"use client";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskMoney } from "@/lib/masks";

/** Descrição, valor e datas da conta. */
export function AmountsSection() {
  return (
    <FormSection title="Conta">
      <TextField name="description" label="Descrição" required maxLength={255} placeholder="Ex.: CEEE - energia elétrica" autoComplete="off" />
      <FieldRow>
        <TextField name="document_number" label="Documento" maxLength={60} hint="Nota fiscal ou código de barras." autoComplete="off" />
        <TextField name="amount" label="Valor" required inputMode="numeric" mask={(value) => maskMoney(value, 12)} placeholder="0,00" />
      </FieldRow>
      <FieldRow>
        <TextField name="issue_date" label="Emissão" type="date" />
        <TextField name="due_date" label="Vencimento" type="date" required />
      </FieldRow>
    </FormSection>
  );
}
