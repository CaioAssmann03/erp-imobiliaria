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
import {
  BLOCK_DEFAULTS,
  blockSchema,
  blockToForm,
  type BlockFormInput,
  type BlockFormOutput,
} from "@/lib/schemas/block";

import { BLOCKS_URL, useBlockSubmit } from "./block-form/use-block-submit";

/** Cadastro e edição de bloco. O condomínio só é escolhido no cadastro. */
export function BlockForm({
  blockId,
  condominiumId,
  returnUrl = BLOCKS_URL,
}: {
  blockId?: string;
  /** Cadastro a partir de um condomínio: já vem escolhido e o campo some. */
  condominiumId?: string;
  returnUrl?: string;
}) {
  const router = useRouter();
  const isEdit = blockId !== undefined;

  const { data: block, isLoading } = useBlocksRetrieve(blockId ?? "", { query: { enabled: isEdit } });
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
        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push(returnUrl)}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
