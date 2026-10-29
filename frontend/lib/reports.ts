/** Meses do filtro dos relatórios: o mês de `todayIso` e os anteriores, como primeiro dia do mês ISO. */
export function reportMonths(todayIso: string, count: number): string[] {
  const [year, month] = todayIso.split("-").map(Number);
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
  });
}

/** O mês que a prestação de contas abre: o anterior ao de hoje (a que se refere o síndico no começo do mês). */
export function defaultAccountabilityMonth(todayIso: string): string {
  return reportMonths(todayIso, 2)[1];
}

/** Nome do arquivo baixado da inadimplência: "inadimplencia-2026-10-29.pdf". */
export const delinquencyPdfName = (asOfIso: string) => `inadimplencia-${asOfIso}.pdf`;

/** Nome do arquivo baixado da prestação de contas: "prestacao-de-contas-0004-2026-10.pdf". */
export function accountabilityPdfName(condominiumCode: number, monthIso: string): string {
  return `prestacao-de-contas-${String(condominiumCode).padStart(4, "0")}-${monthIso.slice(0, 7)}.pdf`;
}

/** Dias de atraso em texto: 1 → "1 dia", 12 → "12 dias". */
export const daysLateLabel = (days: number) => (days === 1 ? "1 dia" : `${days} dias`);
