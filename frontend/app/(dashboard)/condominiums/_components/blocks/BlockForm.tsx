"use client";

import { useRouter } from "next/navigation";

import { TextField } from "@/components/form/fields";
import { CondominiumField } from "@/components/form/CondominiumField";

import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";

import { useBlocksRetrieve } from "@/lib/api/generated";
import { newBlockUrl } from "@/lib/condominiums/block-workspace";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { throwIfPageError } from "@/lib/query/page-error";
import { BLOCK_DEFAULTS, blockSchema, blockToForm } from "@/lib/schemas/block";

import { BlockDeleteButton } from "./BlockDeleteButton";
import { useBlockSubmit } from "./block-form/use-block-submit";
import { RecordForm } from "@/components/form/RecordForm";
import { SectionAnchor } from "@/components/form/SectionAnchor";
import { useRecordForm } from "@/hooks/use-record-form";

/** Cadastro e edição de bloco. O condomínio vem da rota no cadastro (`/condominiums/[id]/blocks/new`). */
export function BlockForm({
  blockId,
  condominiumId,
  returnUrl,
}: {
  blockId?: string;
  /** Cadastro a partir de um condomínio: já vem escolhido e o campo do condomínio mostra o dele (trocá-lo abre o cadastro do outro). */
  condominiumId?: string;
  /** Para onde volta ao salvar ou cancelar; sem ele, à seção de blocos do condomínio. */
  returnUrl?: string;
}) {
  const router = useRouter();
  const isEdit = blockId !== undefined;

  const { data: block, isLoading, error: loadError } = useBlocksRetrieve(blockId ?? "", { query: { enabled: isEdit } });
  throwIfPageError(loadError);

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
          {!isEdit && condominiumId && <CondominiumField value={condominiumId} onChange={(condominium) => router.replace(newBlockUrl(condominium))} />}
          <TextField name="name" label="Bloco" required maxLength={60} placeholder="Ex.: Bloco A" autoComplete="off" />
        </FormSection>
      </SectionAnchor>
    </RecordForm>
  );
}
