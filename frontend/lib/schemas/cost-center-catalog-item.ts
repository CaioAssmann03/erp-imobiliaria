import { z } from "zod";

import type { CostCenterCatalogItem } from "@/lib/api/generated/models";

import { requiredText } from "./fields";

export const costCenterCatalogItemSchema = z.object({
  /** Vazio no cadastro: o sistema dá o próximo código livre da administradora (0 é a Conta Normal). */
  code: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, "Use até 4 dígitos")
    .transform((value) => (value === "" ? undefined : Number(value))),
  name: requiredText("a sub-conta", { max: 120 }),
  active: z.boolean(),
});

export type CostCenterCatalogItemFormInput = z.input<typeof costCenterCatalogItemSchema>;
export type CostCenterCatalogItemFormOutput = z.output<typeof costCenterCatalogItemSchema>;

export const COST_CENTER_CATALOG_ITEM_DEFAULTS: CostCenterCatalogItemFormInput = { code: "", name: "", active: true };

export const costCenterCatalogItemToForm = (item: CostCenterCatalogItem): CostCenterCatalogItemFormInput => ({
  code: item.code === undefined ? "" : String(item.code),
  name: item.name,
  active: item.active ?? true,
});

export const costCenterCatalogItemToPayload = (values: CostCenterCatalogItemFormOutput): Record<string, unknown> => ({
  ...(values.code === undefined ? {} : { code: values.code }),
  name: values.name,
  active: values.active,
});
