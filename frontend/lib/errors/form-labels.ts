/**
 * Como o resumo de erros do formulário chama um campo que não está na tela (por exemplo, os itens de um plano
 * enquanto o condomínio não foi escolhido) ou que se repete em uma lista ("Item 2 · Valor").
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

/** O nome de uma linha de cada lista de campos do sistema. */
const ROW_NOUNS: Record<string, string> = { items: "Item", lines: "Lançamento" };

/** O rótulo dos campos (pelo nome da API) para quando o rótulo não pode ser lido da tela. */
const FIELD_LABELS: Record<string, string> = {
  condominium: "Condomínio",
  description: "Descrição",
  cost_center: "Sub-conta",
  entry_template: "Modelo de lançamento",
  amount: "Valor",
  calculation_kind: "Cálculo",
  apportionment_criterion: "Critério de rateio",
  fractions: "Frações",
  unit_value_field: "Valor lido da unidade",
  start_month: "Mês inicial",
  end_month: "Mês final",
  name: "Nome",
};

/**
 * O texto de um campo com erro: o rótulo lido da tela quando existe, senão o nome conhecido, senão o nome da API.
 * Um campo de uma lista (`items.1.amount`) leva a linha na frente: "Item 2 · Valor".
 */
export function describeField(path: string, screenLabel: string | null): string {
  const row = /^([a-z_]+)\.(\d+)\.(.+)$/.exec(path);
  const field = row ? row[3] : path;
  const noun = row ? ROW_NOUNS[row[1]] : undefined;
  const prefix = row && noun ? `${noun} ${Number(row[2]) + 1} · ` : "";
  return `${prefix}${screenLabel ?? FIELD_LABELS[field] ?? field}`;
}
