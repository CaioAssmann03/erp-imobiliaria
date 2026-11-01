import { isValidIsoDate } from "./validators.ts";

/** Só dígitos, no formato "dd/mm/aaaa" enquanto se digita. */
export const maskDate = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join("/");
};

/** "28/10/2026" → "2026-10-28" (só se for uma data que existe). */
export const toIso = (text: string): string | undefined => {
  if (text.length !== 10) return undefined;
  const iso = `${text.slice(6)}-${text.slice(3, 5)}-${text.slice(0, 2)}`;
  return isValidIsoDate(iso) ? iso : undefined;
};
