"use client";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskPhone } from "@/lib/format/masks";

export function ContactSection() {
  return (
    <FormSection title="Contato" description="Informe ao menos uma forma de contato quando possível.">
      <TextField
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="nome@dominio.com"
      />
      <FieldRow columns={3}>
        <TextField
          name="cell_number"
          label="Celular"
          mask={maskPhone}
          inputMode="tel"
          placeholder="(00) 00000-0000"
        />
        <TextField
          name="home_phone"
          label="Residencial"
          mask={maskPhone}
          inputMode="tel"
          placeholder="(00) 0000-0000"
        />
        <TextField
          name="business_phone"
          label="Comercial"
          mask={maskPhone}
          inputMode="tel"
          placeholder="(00) 0000-0000"
        />
      </FieldRow>
    </FormSection>
  );
}
