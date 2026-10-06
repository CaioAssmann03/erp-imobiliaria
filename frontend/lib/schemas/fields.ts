import { z } from "zod";

import { maskCep, maskPhone, onlyDigits, parseLocaleNumber } from "@/lib/masks";
import { isValidIsoDate, UFS } from "@/lib/validators";

// Mensagens padrão do Zod em português (as específicas abaixo têm texto próprio).
z.config(z.locales.pt());

/**
 * Blocos de schema reutilizáveis. Entrada: strings do formulário (já mascaradas).
 * Saída: valores normalizados prontos para a API (`undefined` = campo vazio).
 */

const collapse = (value: string) => value.replace(/\s+/g, " ").trim();

/** Texto livre: remove espaços sobrando; vazio → undefined (opcional). */
export const optionalText = (label: string, max: number) =>
  z
    .string()
    .transform(collapse)
    .pipe(z.string().max(max, `${label} deve ter no máximo ${max} caracteres`))
    .transform((value) => value || undefined);

/** Texto obrigatório. */
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const requiredText = (label: string, { min = 1, max }: { min?: number; max: number }) =>
  z
    .string()
    .transform(collapse)
    .pipe(
      z
        .string()
        .min(1, `Informe ${label}`)
        .min(min, `${capitalize(label)} deve ter pelo menos ${min} caracteres`)
        .max(max, `${capitalize(label)} deve ter no máximo ${max} caracteres`)
    );

export const emailField = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z.union([
      z.literal(""),
      z.email("Email inválido. Ex.: nome@dominio.com").max(254, "Email muito longo"),
    ])
  )
  .transform((value) => value || undefined);

export const phoneField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .refine(
        (value) => value === "" || [10, 11].includes(onlyDigits(value).length),
        "Telefone inválido. Use DDD + número"
      )
  )
  .transform((value) => (value ? maskPhone(value) : undefined));

export const cepField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .refine((value) => value === "" || onlyDigits(value).length === 8, "CEP inválido. Use 8 dígitos")
  )
  .transform((value) => (value ? maskCep(value) : undefined));

export const ufField = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .pipe(
    z
      .string()
      .refine((value) => value === "" || (UFS as readonly string[]).includes(value), "UF inválida")
  )
  .transform((value) => value || undefined);

export function dateField(
  label: string,
  { min, max }: { min?: string; max?: "today" | string } = {}
) {
  return z
    .string()
    .transform((value, ctx) => {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      if (!isValidIsoDate(trimmed)) {
        ctx.addIssue({ code: "custom", message: `${label} inválida` });
        return z.NEVER;
      }
      const limit = max === "today" ? new Date().toISOString().slice(0, 10) : max;
      if (min && trimmed < min) {
        ctx.addIssue({ code: "custom", message: `${label} não pode ser anterior a ${min.split("-").reverse().join("/")}` });
        return z.NEVER;
      }
      if (limit && trimmed > limit) {
        ctx.addIssue({
          code: "custom",
          message: max === "today" ? `${label} não pode ser no futuro` : `${label} muito distante`,
        });
        return z.NEVER;
      }
      return trimmed;
    });
}

export function intField(label: string, min: number, max: number) {
  return z.string().transform((raw, ctx) => {
    const value = raw.trim();
    if (!value) return undefined;
    const number = Number(value);
    if (!Number.isInteger(number)) {
      ctx.addIssue({ code: "custom", message: `${label} deve ser um número inteiro` });
      return z.NEVER;
    }
    if (number < min || number > max) {
      ctx.addIssue({ code: "custom", message: `${label} deve estar entre ${min} e ${max}` });
      return z.NEVER;
    }
    return number;
  });
}

/** Decimal digitado em pt-BR ("1.234,56" / "12,5") → string da API com `decimals` casas. */
export function decimalField(
  label: string,
  { min = 0, max, decimals = 2 }: { min?: number; max: number; decimals?: number }
) {
  return z.string().transform((raw, ctx) => {
    if (!raw.trim()) return undefined;
    const number = parseLocaleNumber(raw);
    if (Number.isNaN(number)) {
      ctx.addIssue({ code: "custom", message: `${label} inválido` });
      return z.NEVER;
    }
    if (number < min || number > max) {
      ctx.addIssue({
        code: "custom",
        message:
          min === 0 && max === 100
            ? `${label} deve estar entre 0% e 100%`
            : `${label} deve ser entre ${min.toLocaleString("pt-BR")} e ${max.toLocaleString("pt-BR")}`,
      });
      return z.NEVER;
    }
    return number.toFixed(decimals);
  });
}

export const enumField = <T extends [string, ...string[]]>(values: T, message = "Selecione uma opção") =>
  z.enum(values, { error: message });
