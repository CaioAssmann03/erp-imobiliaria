"use client";

import { TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { maskCep } from "@/lib/masks";

import { AddressMap } from "./AddressMap";
import { useZipCodeAutofill } from "./use-zip-code-autofill";

export function AddressSection({ mapsEmbedKey }: { mapsEmbedKey?: string }) {
  const { onZipCodeChange, hint } = useZipCodeAutofill();

  return (
    <FormSection title="Endereço">
      <FieldRow template="1fr 2fr">
        <TextField
          name="zip_code"
          label="CEP"
          mask={maskCep}
          onValueChange={onZipCodeChange}
          inputMode="numeric"
          placeholder="00000-000"
          hint={hint}
        />
        <TextField name="street" label="Logradouro" maxLength={255} />
      </FieldRow>
      <FieldRow template="1fr 2fr">
        <TextField name="number" label="Número" maxLength={10} />
        <TextField name="complement" label="Complemento" maxLength={60} />
      </FieldRow>
      <FieldRow template="2fr 2fr 1fr">
        <TextField name="district" label="Bairro" maxLength={120} />
        <TextField name="city" label="Cidade" maxLength={120} />
        <TextField
          name="state"
          label="UF"
          maxLength={2}
          mask={(value) => value.toUpperCase().replace(/[^A-Z]/g, "")}
          placeholder="SP"
        />
      </FieldRow>
      <AddressMap apiKey={mapsEmbedKey} />
      <FieldRow>
        <TextField name="water_meter" label="Hidrômetro" maxLength={30} />
        <TextField name="electricity_meter" label="Relógio de luz" maxLength={30} />
      </FieldRow>
    </FormSection>
  );
}
