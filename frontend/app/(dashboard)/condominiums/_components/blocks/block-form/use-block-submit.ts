"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";

import {
  getBlocksListQueryKey,
  getBlocksRetrieveQueryKey,
  useBlocksCreate,
  useBlocksPartialUpdate,
} from "@/lib/api/generated";
import type { Block } from "@/lib/api/generated/models";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { blockToPayload, type BlockFormInput, type BlockFormOutput } from "@/lib/schemas/block";
import { toast } from "@/lib/errors/toast";

export function useBlockSubmit(
  blockId: string | undefined,
  setError: UseFormSetError<BlockFormInput>,
  /** Sem ele, volta à seção de blocos do condomínio do bloco salvo. */
  returnUrl?: string
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBlocksCreate();
  const updateMutation = useBlocksPartialUpdate();
  const isEdit = blockId !== undefined;

  const done = (message: string, saved: Block) => {
    const id = saved.id;
    queryClient.invalidateQueries({ queryKey: getBlocksListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBlocksRetrieveQueryKey(id) });
    toast.success(message);
    router.push(returnUrl ?? condominiumPageUrl(saved.condominium, "blocks"));
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: BlockFormOutput) => {
    const payload = blockToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: blockId, data: payload as Partial<Block> },
        { onSuccess: (saved) => done("Bloco salvo.", saved), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Block },
        { onSuccess: (created) => done("Bloco cadastrado.", created), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
