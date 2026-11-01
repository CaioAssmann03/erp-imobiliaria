"use client";

import { useFormContext } from "react-hook-form";

import { CheckboxField, SearchSelectField, SelectField, TextField } from "@/components/form/fields";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { NewBlockDialog } from "@/app/(dashboard)/condominiums/_components/blocks/NewBlockDialog";
import { useBlocksList } from "@/lib/api/generated";
import { maskInteger } from "@/lib/format/masks";
import { UNIT_TYPES } from "@/lib/schemas/unit";

/** A unidade, o tipo e o bloco (com o **+** que cadastra um bloco novo ali mesmo, depois do tipo para não parecer um novo tipo), a matrícula, os moradores e a situação. */
export function IdentificationSection({ condominiumId }: { condominiumId: string }) {
  const { setValue } = useFormContext();
  const { data: blocks } = useBlocksList({ condominium: condominiumId, limit: 100 });

  return (
    <FormSection title="Identificação">
      <FieldRow columns={3}>
        <TextField
          name="name"
          label="Unidade"
          required
          maxLength={30}
          placeholder="Ex.: 101"
          autoComplete="off"
        />
        <SelectField name="type" label="Tipo" options={UNIT_TYPES} />
        <div className="flex items-end gap-2">
          <SearchSelectField
            name="block"
            label="Bloco"
            placeholder="Sem bloco"
            className="min-w-0 flex-1"
            options={(blocks?.results ?? []).map((block) => ({ value: block.id, label: block.name }))}
          />
          <NewBlockDialog condominiumId={condominiumId} onCreated={(block) => setValue("block", block.id, { shouldDirty: true, shouldValidate: true })} />
        </div>
      </FieldRow>
      <FieldRow>
        <TextField name="registration_number" label="Matrícula do imóvel" maxLength={60} />
        <TextField
          name="resident_count"
          label="Nº de moradores"
          mask={(value) => maskInteger(value, 3)}
          inputMode="numeric"
        />
      </FieldRow>
      <FieldRow>
        <CheckboxField name="is_manager_unit" label="Unidade do síndico" />
        <CheckboxField name="active" label="Cadastro ativo" />
      </FieldRow>
    </FormSection>
  );
}
