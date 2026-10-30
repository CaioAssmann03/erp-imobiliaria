/** As janelas de vencimento das contas em aberto do painel. Cada uma vira parâmetros da API (`due_date_after`, `due_date_before`): quem filtra é o servidor. */
export type PayableWindow = "all" | "overdue" | "today" | "week" | "month";

export const PAYABLE_WINDOWS: readonly { id: PayableWindow; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "overdue", label: "Atrasadas" },
  { id: "today", label: "Vencem hoje" },
  { id: "week", label: "Próximos 7 dias" },
  { id: "month", label: "Neste mês" },
];

export interface DueDateRange {
  due_date_after?: string;
  due_date_before?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** `iso` ("2026-10-30") deslocado em `days` dias, em UTC para o horário de verão não mexer no dia. */
const shifted = (iso: string, days: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** O último dia do mês de `iso`. */
const endOfMonth = (iso: string): string => {
  const [year, month] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
};

/** O intervalo de vencimento da janela, a partir de hoje (`today`, "2026-10-30"). Atrasadas: venceram antes de hoje. */
export function windowRange(window: PayableWindow, today: string): DueDateRange {
  switch (window) {
    case "overdue":
      return { due_date_before: shifted(today, -1) };
    case "today":
      return { due_date_after: today, due_date_before: today };
    case "week":
      return { due_date_after: today, due_date_before: shifted(today, 7) };
    case "month":
      return { due_date_after: today, due_date_before: endOfMonth(today) };
    default:
      return {};
  }
}
