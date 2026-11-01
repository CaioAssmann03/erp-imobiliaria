"use client";

import { SearchSelectField, TextField } from "@/components/form/fields";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";

import { useBlocksRetrieve, useCondominiumsList } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { throwIfPageError } from "@/lib/query/page-error";
import { BLOCK_DEFAULTS, blockSchema, blockToForm } from "@/lib/schemas/block";

import { BlockDeleteButton } from "./BlockDeleteButton";
import { useBlockSubmit } from "./block-form/use-block-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de bloco. O condomínio só é escolhido no cadastro. */
export function BlockForm({
  blockId,
  condominiumId,
  returnUrl,
}: {
  blockId?: string;
  /** Cadastro a partir de um condomínio: já vem escolhido e o campo some. */
  condominiumId?: string;
  /** Para onde volta ao salvar ou cancelar; sem ele, à seção de blocos do condomínio. */
  returnUrl?: string;
}) {
  const isEdit = blockId !== undefined;

  const { data: block, isLoading, error: loadError } = useBlocksRetrieve(blockId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const methods = useRecordForm({
    schema: blockSchema,
    defaults: { ...BLOCK_DEFAULTS, condominium: condominiumId ?? "" },
    record: block,
    toForm: blockToForm,
  });
  const { submit, isSubmitting } = useBlockSubmit(blockId, methods.setError, returnUrl);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <RecordForm
      methods={methods}
      onSubmit={submit}
      isSubmitting={isSubmitting}
      cancelHref={returnUrl ?? (block ? condominiumPageUrl(block.condominium, "blocks") : "/condominiums")}
      danger={block && <BlockDeleteButton condominiumId={block.condominium} blockId={block.id} name={block.name} />}
    >
      <SectionAnchor id="dados-gerais">
        <FormSection title="Identificação">
          {!isEdit && !condominiumId && (
            <SearchSelectField
              name="condominium"
              label="Condomínio"
              required
              placeholder="Selecione"
              options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <TextField name="name" label="Bloco" required maxLength={60} placeholder="Ex.: Bloco A" autoComplete="off" />
        </FormSection>
      </SectionAnchor>
    </RecordForm>
  );
}
