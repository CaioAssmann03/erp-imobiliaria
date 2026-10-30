/**
 * O que a tela "Boleto extra" envia à API (spec 054).
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

export type ExtraAllocation = "individual" | "collective" | "fraction";

export interface ExtraLineValues {
  /** Id do evento; "" = sem evento. */
  event: string;
  /** O evento escolhido é da imobiliária (a tarifa): sem sub-conta, o dinheiro nunca vai para o condomínio. */
  credits_company: boolean;
  description: string;
  allocation: ExtraAllocation;
  /** Id do critério de rateio no rateio por fração; "" nos outros. */
  apportionment_criterion: string;
  cost_center: string;
  /** Valor da API ("300.00"). */
  amount: string;
}

export interface ExtraValues {
  condominium: string;
  /** Primeiro dia do mês ("2026-10-01"). */
  competence_month: string;
  /** Data ISO ("2026-11-10"). */
  due_date: string;
  units: string[];
  lines: ExtraLineValues[];
}

/** Uma linha em branco: o rateio coletivo é o mais comum numa cobrança extra (obra, conserto). */
export const newLine = (): ExtraLineValues => ({
  event: "",
  credits_company: false,
  description: "",
  allocation: "collective",
  apportionment_criterion: "",
  cost_center: "",
  amount: "",
});

/** A tarifa de registro: o evento da imobiliária, o mesmo valor em cada unidade, sem sub-conta. */
export const feeLine = (event: string, amount: string): ExtraLineValues => ({
  ...newLine(),
  event,
  credits_company: true,
  allocation: "individual",
  amount,
});

/** O corpo do pedido: o critério só vai no rateio por fração e a sub-conta não vai na linha da imobiliária. */
export function extraToPayload(values: ExtraValues): Record<string, unknown> {
  return {
    condominium: values.condominium,
    competence_month: values.competence_month,
    due_date: values.due_date,
    units: values.units,
    lines: values.lines.map((line) => ({
      event: line.event || null,
      description: line.description,
      allocation: line.allocation,
      apportionment_criterion: line.allocation === "fraction" ? line.apportionment_criterion : null,
      cost_center: line.credits_company ? null : line.cost_center,
      amount: line.amount,
    })),
  };
}

/** Os erros das unidades chegam como `units.<n>`; o formulário mostra o da lista inteira em `units`. Os das linhas ficam como estão. */
export function extraErrorPath(path: string): string {
  return path.startsWith("units") ? "units" : path;
}
