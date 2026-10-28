import { z } from "zod";

import { requiredText } from "./fields";

/** Um critério de rateio do condomínio ("Geral", "Elevador"...): só o nome; a posição é dada pela API. */
export const apportionmentCriterionSchema = z.object({
  name: requiredText("o nome do critério", { max: 100 }),
});

export type ApportionmentCriterionFormInput = z.input<typeof apportionmentCriterionSchema>;
export type ApportionmentCriterionFormOutput = z.output<typeof apportionmentCriterionSchema>;

export const APPORTIONMENT_CRITERION_DEFAULTS: ApportionmentCriterionFormInput = { name: "" };
