/** Como um mês se desenha numa grade de semanas que começam no domingo: o dia da semana do dia 1 (0 = domingo) e quantos dias o mês tem. O mês vai de 1 a 12. */
export function monthLayout(year: number, month: number): { offset: number; days: number } {
  return {
    offset: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    days: new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
}

/** Um dia como ISO: (2026, 3, 7) → "2026-03-07". */
export const isoDate = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** O mês seguinte (ou anterior, com `step` negativo) de um ano e mês, virando o ano quando preciso. */
export function shiftMonth(year: number, month: number, step: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + step;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
