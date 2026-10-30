"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { SelectField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import { useBlocksRetrieve, useCondominiumsList } from "@/lib/api/generated";
import { condominiumPageUrl } from "@/lib/condominium-registry";
import { throwIfNotFound } from "@/lib/query/not-found";
import {
  BLOCK_DEFAULTS,
  blockSchema,
  blockToForm,
  type BlockFormInput,
  type BlockFormOutput,
} from "@/lib/schemas/block";

import { BlockDeleteButton } from "./BlockDeleteButton";
import { useBlockSubmit } from "./block-form/use-block-submit";

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
  const router = useRouter();
  const isEdit = blockId !== undefined;

  const { data: block, isLoading, error: loadError } = useBlocksRetrieve(blockId ?? "", { query: { enabled: isEdit } });
  throwIfNotFound(loadError);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });

  const methods = useForm<BlockFormInput, unknown, BlockFormOutput>({
    resolver: zodResolver(blockSchema),
    defaultValues: { ...BLOCK_DEFAULTS, condominium: condominiumId ?? "" },
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;
  const { submit, isSubmitting } = useBlockSubmit(blockId, setError, returnUrl);

  useEffect(() => {
    if (block) reset(blockToForm(block));
  }, [block, reset]);

  if (isEdit && isLoading) return <FormSkeleton sections={1} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <div id="dados-gerais" className="scroll-mt-20">
        <FormSection title="Identificação">
          {!isEdit && !condominiumId && (
            <SelectField
              name="condominium"
              label="Condomínio"
              required
              placeholder="Selecione"
              options={(condominiums?.results ?? []).map((item) => ({ value: item.id, label: item.name }))}
            />
          )}
          <TextField name="name" label="Bloco" required maxLength={60} placeholder="Ex.: Bloco A" autoComplete="off" />
        </FormSection>
        </div>
        <FormActions
          isSubmitting={isSubmitting}
          danger={block && <BlockDeleteButton condominiumId={block.condominium} blockId={block.id} name={block.name} />}
        >
          <Button type="button" variant="secondary" onClick={() => router.push(returnUrl ?? (block ? condominiumPageUrl(block.condominium, "blocks") : "/condominiums"))}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
