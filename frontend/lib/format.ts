/** Formatação de exibição compartilhada (valores da API → texto em pt-BR). */

/** "1234.5" | 1234.5 → "R$ 1.234,50" */
export const brl = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "2025-03-31" → "31/03/2025" */
export const formatDate = (iso: string) => iso.split("-").reverse().join("/");

/** "2026-10-01" → "10/2026" (competência: mês e ano) */
export const formatMonth = (iso: string) => {
  const [year, month] = iso.split("-");
  return `${month}/${year}`;
};

/** Hoje como "AAAA-MM-DD" no fuso local (`toISOString` usaria UTC e viraria o dia à noite). */
export const todayIso = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const isoOf = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/** "2026-10-06" + 7 → "2026-10-13" (dias corridos, calendário local). */
export const addDays = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return isoOf(date);
};

/** Primeiro e último dia do mês de uma data ISO, somando `monthOffset` meses (0 = o mês da data). */
export const monthBounds = (iso: string, monthOffset = 0) => {
  const date = new Date(`${iso}T00:00:00`);
  const first = new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + monthOffset + 1, 0);
  return { from: isoOf(first), to: isoOf(last) };
};

/** Os últimos `count` meses (o atual primeiro) como primeiro dia do mês ISO, para o filtro de competência. */
export const recentMonths = (iso: string, count: number) =>
  Array.from({ length: count }, (_, offset) => monthBounds(iso, -offset).from);

/** Tamanho de arquivo legível: 2048 -> "2,0 KB", 3_145_728 -> "3,0 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${units[unit]}`;
}
