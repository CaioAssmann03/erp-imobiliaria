"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { CheckboxField, SearchSelectField, SelectField, TextField } from "@/components/form/fields";
import { CondominiumField } from "@/components/form/CondominiumField";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { NewBlockDialog } from "@/app/(dashboard)/condominiums/_components/blocks/NewBlockDialog";
import { useBlocksList } from "@/lib/api/generated";
import { uuidParam } from "@/lib/api/uuid-param";
import { newUnitUrl, withBlockParam } from "@/lib/condominiums/unit-workspace";
import { maskInteger } from "@/lib/format/masks";
import { UNIT_TYPES } from "@/lib/schemas/unit";

/** No cadastro, o condomínio (o da lista ao lado; trocá-lo abre o cadastro do outro); a unidade, o tipo e o bloco (com o **+** que cadastra um bloco novo ali mesmo, depois do tipo para não parecer um novo tipo), a matrícula, os moradores e a situação. */
export function IdentificationSection({ condominiumId, isNew }: { condominiumId: string; isNew: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { getValues, setValue } = useFormContext();
  const { data: blocks } = useBlocksList({ condominium: condominiumId, limit: 100 });

  // O bloco do campo e o da lista da esquerda andam juntos pelo endereço (`?block=`): escolher aqui o escreve (a lista o lê); numa unidade nova, escolher na
  // lista o escreve e o campo o lê. Numa unidade que já existe o campo não muda com a lista (mudaria o dado dela sem ninguém pedir).
  const urlBlock = params.get("block");
  useEffect(() => {
    if (!isNew || urlBlock === null) return;
    const next = uuidParam(urlBlock) ?? "";
    if (next !== getValues("block")) setValue("block", next, { shouldDirty: true, shouldValidate: true });
  }, [isNew, urlBlock, getValues, setValue]);

  return (
    <FormSection title="Identificação">
      {isNew && <CondominiumField value={condominiumId} onChange={(condominium) => router.replace(newUnitUrl(condominium))} />}
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
            onValueChange={(block) => router.replace(`${pathname}?${withBlockParam(params.toString(), block)}`)}
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
