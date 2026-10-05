import { z } from "zod";

import type { CostCenter } from "@/lib/api/generated/models";

import { requiredText } from "./fields";

export const costCenterSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  name: requiredText("a sub-conta", { max: 120 }),
  active: z.boolean(),
});

export type CostCenterFormInput = z.input<typeof costCenterSchema>;
export type CostCenterFormOutput = z.output<typeof costCenterSchema>;

export const COST_CENTER_DEFAULTS: CostCenterFormInput = { condominium: "", name: "", active: true };

export const costCenterToForm = (costCenter: CostCenter): CostCenterFormInput => ({
  condominium: costCenter.condominium,
  name: costCenter.name,
  active: costCenter.active ?? true,
});

/** Corpo da requisição; o condomínio de uma sub-conta existente não muda (PATCH sem ele). */
export const costCenterToPayload = (values: CostCenterFormOutput, isEdit: boolean): Record<string, unknown> => ({
  ...(isEdit ? {} : { condominium: values.condominium }),
  name: values.name,
  active: values.active,
});
