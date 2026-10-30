"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { DateField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow } from "@/components/form/FormSection";
import { maskCnpj, maskCpf, maskPhone } from "@/lib/masks";
import { MARITAL_STATUSES, PERSON_KINDS } from "@/lib/schemas/person";

/** Os campos de uma pessoa nova, com os mesmos dados da tela de Pessoas (nos modais de pessoa nova e de fornecedor novo): identificação (os dados pessoais só da pessoa física) e contato. */
export function NewPersonFields() {
  const { getValues, setValue } = useFormContext();
  const kind = useWatch({ name: "kind" }) as string;
  const isIndividual = kind === "individual";

  // Ao trocar entre física e jurídica, reaplica a máscara do documento.
  useEffect(() => {
    const current = getValues("document") as string;
    if (current) setValue("document", isIndividual ? maskCpf(current) : maskCnpj(current));
  }, [isIndividual, getValues, setValue]);

  return (
    <div className="space-y-5">
      <FieldRow template="2fr 1fr">
        <TextField name="name" label={isIndividual ? "Nome completo" : "Razão social"} required maxLength={255} autoComplete="off" />
        <SelectField name="kind" label="Tipo de pessoa" options={PERSON_KINDS} />
      </FieldRow>
      <FieldRow columns={3}>
        <TextField
          name="document"
          label={isIndividual ? "CPF" : "CNPJ"}
          required
          inputMode="numeric"
          mask={isIndividual ? maskCpf : maskCnpj}
          placeholder={isIndividual ? "000.000.000-00" : "00.000.000/0000-00"}
          autoComplete="off"
        />
        {isIndividual ? <TextField name="rg" label="RG" maxLength={10} autoComplete="off" /> : <TextField name="ie" label="Inscrição estadual" maxLength={20} autoComplete="off" />}
        {isIndividual && <DateField name="birthday" label="Data de nascimento" />}
      </FieldRow>
      {isIndividual && (
        <FieldRow>
          <TextField name="marital_status" label="Estado civil" suggestions={MARITAL_STATUSES} maxLength={30} autoComplete="off" />
          <TextField name="job" label="Profissão" maxLength={120} autoComplete="off" />
        </FieldRow>
      )}
      <TextField name="email" label="Email" type="email" inputMode="email" placeholder="nome@dominio.com" autoComplete="off" />
      <FieldRow columns={3}>
        <TextField name="cell_number" label="Celular" mask={maskPhone} inputMode="tel" placeholder="(00) 00000-0000" autoComplete="off" />
        <TextField name="home_phone" label="Residencial" mask={maskPhone} inputMode="tel" placeholder="(00) 0000-0000" autoComplete="off" />
        <TextField name="business_phone" label="Comercial" mask={maskPhone} inputMode="tel" placeholder="(00) 0000-0000" autoComplete="off" />
      </FieldRow>
    </div>
  );
}
