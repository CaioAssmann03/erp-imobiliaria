import { z } from "zod";

import type { CostCenter } from "@/lib/api/generated/models";

export const costCenterSchema = z.object({
  condominium: z.string().min(1, "Selecione o condomínio"),
  /** A sub-conta do catálogo da administradora: o código e o nome vêm dela (spec 053). */
  catalog_item: z.string().min(1, "Escolha a sub-conta do catálogo"),
  active: z.boolean(),
});

export type CostCenterFormInput = z.input<typeof costCenterSchema>;
export type CostCenterFormOutput = z.output<typeof costCenterSchema>;

export const COST_CENTER_DEFAULTS: CostCenterFormInput = { condominium: "", catalog_item: "", active: true };

export const costCenterToForm = (costCenter: CostCenter): CostCenterFormInput => ({
  condominium: costCenter.condominium,
  catalog_item: costCenter.catalog_item,
  active: costCenter.active ?? true,
});

/** Corpo da requisição; o condomínio e a sub-conta do catálogo de uma sub-conta existente não mudam (PATCH só com "ativa"). */
export const costCenterToPayload = (values: CostCenterFormOutput, isEdit: boolean): Record<string, unknown> =>
  isEdit
    ? { active: values.active }
    : { condominium: values.condominium, catalog_item: values.catalog_item, active: values.active };
