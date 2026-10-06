/**
 * Máscaras de digitação (string → string) e conversões entre o formato exibido
 * (pt-BR: "1.234,56") e o formato da API ("1234.56"). Funções puras.
 */

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Só dígitos, limitados a `maxDigits` (dias, quantidades, periodicidade). */
export const maskInteger = (value: string, maxDigits: number) => onlyDigits(value).slice(0, maxDigits);

/** Aplica um padrão ("###.###.###-##") aos dígitos, sem literais sobrando no fim. */
function applyPattern(digits: string, pattern: string) {
  let result = "";
  let index = 0;
  for (const char of pattern) {
    if (index >= digits.length) break;
    if (char === "#") {
      result += digits[index++];
    } else {
      result += char;
    }
  }
  return result;
}

export const maskCpf = (value: string) =>
  applyPattern(onlyDigits(value).slice(0, 11), "###.###.###-##");

export const maskCnpj = (value: string) =>
  applyPattern(onlyDigits(value).slice(0, 14), "##.###.###/####-##");

/** CPF até 11 dígitos; a partir do 12º vira CNPJ. */
export const maskCpfCnpj = (value: string) => {
  const digits = onlyDigits(value);
  return digits.length <= 11 ? maskCpf(digits) : maskCnpj(digits);
};

export const maskCep = (value: string) =>
  applyPattern(onlyDigits(value).slice(0, 8), "#####-###");

/** Fixo (10 dígitos) ou celular (11 dígitos), com DDD. */
export const maskPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  return applyPattern(digits, digits.length <= 10 ? "(##) ####-####" : "(##) #####-####");
};

/** Dinheiro digitado "no estilo caixa": 12345 → "123,45"; 123456789 → "1.234.567,89". */
export function maskMoney(value: string, maxDigits = 10) {
  const digits = onlyDigits(value).slice(0, maxDigits);
  if (!digits) return "";
  return (Number(digits) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Decimal com vírgula e casas limitadas (percentuais, frações). Aceita "." como vírgula. */
export function maskDecimal(value: string, decimals: number, maxIntegerDigits = 3) {
  const cleaned = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [integer, ...rest] = cleaned.split(",");
  const intPart = integer.replace(/^0+(?=\d)/, "").slice(0, maxIntegerDigits);
  if (rest.length === 0) return intPart;
  return `${intPart || "0"},${rest.join("").slice(0, decimals)}`;
}

/** "1.234,56" | "12,5" → número (NaN se inválido); string vazia → NaN. */
export function parseLocaleNumber(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

/** Valor da API ("1234.5") → máscara de dinheiro ("1.234,50"). */
export function moneyFromApi(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Valor da API ("12.5") → decimal com vírgula e `decimals` casas ("12,50"). */
export function decimalFromApi(
  value: string | number | null | undefined,
  decimals: number
) {
  if (value === null || value === undefined || value === "") return "";
  return Number(value).toFixed(decimals).replace(".", ",");
}
