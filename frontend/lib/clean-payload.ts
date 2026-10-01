/**
 * Monta o corpo da requisição a partir da saída do schema Zod.
 * - Criação: campos vazios/indefinidos são omitidos (vale o padrão do servidor).
 * - Edição (PATCH): um campo esvaziado precisa ser enviado, senão o valor antigo
 *   permanece. `blankKeys` viram "" (textos) e `nullKeys` viram null (datas etc.).
 */
export function buildPayload(
  values: Record<string, unknown>,
  {
    isEdit,
    blankKeys = [],
    nullKeys = [],
  }: { isEdit: boolean; blankKeys?: string[]; nullKeys?: string[] }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "") {
      if (isEdit && nullKeys.includes(key)) result[key] = null;
      else if (isEdit && blankKeys.includes(key)) result[key] = "";
      continue;
    }
    result[key] = value;
  }
  return result;
}
