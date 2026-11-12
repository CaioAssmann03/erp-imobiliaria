"use client";

import type { UseFormSetError } from "react-hook-form";

import { useRecordSubmit } from "@/hooks/use-record-submit";
import { getBlocksListQueryKey, getBlocksRetrieveQueryKey, useBlocksCreate, useBlocksPartialUpdate } from "@/lib/api/generated";
import type { Block } from "@/lib/api/generated/models";
import { condominiumPageUrl } from "@/lib/condominiums/condominium-registry";
import { blockToPayload, type BlockFormInput, type BlockFormOutput } from "@/lib/schemas/block";

export function useBlockSubmit(
  blockId: string | undefined,
  setError: UseFormSetError<BlockFormInput>,
  /** Sem ele, volta à seção de blocos do condomínio do bloco salvo. */
  returnUrl?: string
) {
  return useRecordSubmit<BlockFormInput, BlockFormOutput, Block>({
    recordId: blockId,
    setError,
    toPayload: blockToPayload,
    create: useBlocksCreate(),
    update: useBlocksPartialUpdate(),
    invalidate: (id) => [getBlocksListQueryKey(), getBlocksRetrieveQueryKey(id)],
    messages: { updated: "Bloco salvo.", created: "Bloco cadastrado." },
    redirect: (block) => returnUrl ?? condominiumPageUrl(block.condominium, "blocks"),
  });
}
