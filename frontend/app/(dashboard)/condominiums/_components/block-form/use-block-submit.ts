"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import {
  getBlocksListQueryKey,
  getBlocksRetrieveQueryKey,
  useBlocksCreate,
  useBlocksPartialUpdate,
} from "@/lib/api/generated";
import type { Block } from "@/lib/api/generated/models";
import { applyServerErrors } from "@/lib/form-errors";
import { blockToPayload, type BlockFormInput, type BlockFormOutput } from "@/lib/schemas/block";

export const BLOCKS_URL = "/condominiums/blocks";

export function useBlockSubmit(
  blockId: string | undefined,
  setError: UseFormSetError<BlockFormInput>,
  returnUrl: string = BLOCKS_URL
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useBlocksCreate();
  const updateMutation = useBlocksPartialUpdate();
  const isEdit = blockId !== undefined;

  const done = (message: string, id: string) => {
    queryClient.invalidateQueries({ queryKey: getBlocksListQueryKey() });
    queryClient.invalidateQueries({ queryKey: getBlocksRetrieveQueryKey(id) });
    toast.success(message);
    router.push(returnUrl);
  };
  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const submit = (values: BlockFormOutput) => {
    const payload = blockToPayload(values, isEdit);
    if (isEdit) {
      updateMutation.mutate(
        { id: blockId, data: payload as Partial<Block> },
        { onSuccess: () => done("Bloco salvo.", blockId), onError }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Block },
        { onSuccess: (created) => done("Bloco cadastrado.", created.id), onError }
      );
    }
  };

  return { submit, isSubmitting: createMutation.isPending || updateMutation.isPending };
}
