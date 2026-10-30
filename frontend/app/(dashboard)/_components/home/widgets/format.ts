export { brl } from "@/lib/format/format";

/** "2025-03" → "mar" */
export function shortMonthLabel(value: string) {
  if (value === "overdue") return "Atras.";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
}

/** "2025-03" → "março de 2025" */
export function longMonthLabel(value: string) {
  if (value === "overdue") return "Reajustes atrasados";
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
