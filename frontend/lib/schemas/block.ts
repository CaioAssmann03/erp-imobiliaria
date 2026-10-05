import { z } from "zod";

import type { Block } from "@/lib/api/generated/models";

import { requiredText } from "./fields";

export const blockSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  name: requiredText("o bloco", { max: 60 }),
});

export type BlockFormInput = z.input<typeof blockSchema>;
export type BlockFormOutput = z.output<typeof blockSchema>;

export const BLOCK_DEFAULTS: BlockFormInput = { condominium: "", name: "" };

export const blockToForm = (block: Block): BlockFormInput => ({
  condominium: block.condominium,
  name: block.name,
});

/** Corpo da requisição; o condomínio de um bloco existente não muda (PATCH sem ele). */
export const blockToPayload = (values: BlockFormOutput, isEdit: boolean): Record<string, unknown> => ({
  ...(isEdit ? {} : { condominium: values.condominium }),
  name: values.name,
});
