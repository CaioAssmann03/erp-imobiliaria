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

/** Nome do arquivo baixado da taxa de administração: "taxa-de-administracao-2026-10.pdf". */
export const administrationFeePdfName = (monthIso: string) => `taxa-de-administracao-${monthIso.slice(0, 7)}.pdf`;

const money = (value: string | number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface FeeRuleSource {
  fee_type: string | null;
  fee_basis: string | null;
  fee_percentage: string | null;
  fee_floor: string | null;
  fee_ceiling: string | null;
}

/** A regra do contrato em palavras: "Valor fixo" ou "10% da receita · mínimo R$ 300,00 · máximo R$ 800,00". */
export function feeRuleLabel(row: FeeRuleSource): string {
  if (row.fee_type === "fixed") return "Valor fixo";
  if (row.fee_type !== "variable") return "—";
  const basis = row.fee_basis === "expense" ? "da despesa" : "da receita";
  const parts = [`${Number(row.fee_percentage)}% ${basis}`.replace(".", ",")];
  if (row.fee_floor !== null) parts.push(`mínimo ${money(row.fee_floor)}`);
  if (row.fee_ceiling !== null) parts.push(`máximo ${money(row.fee_ceiling)}`);
  return parts.join(" · ");
}

/** O que a linha diz quando a taxa não é devida no mês. */
export const feeStatusNote = (status: string): string =>
  status === "not_started" ? "Contrato ainda não iniciado" : status === "no_contract" ? "Sem contrato cadastrado" : "";

/** O endereço da ficha de uma unidade (abre já com o condomínio e a unidade escolhidos). */
export const unitSheetUrl = (condominiumId: string, unitId: string) => `/reports/unit-sheet?condominium=${condominiumId}&unit=${unitId}`;

/** O período padrão da ficha: os 12 meses até o mês de hoje, como primeiros dias de mês ("2025-11-01" a "2026-10-01"). */
export function defaultSheetPeriod(todayIso: string): { from: string; to: string } {
  const months = reportMonths(todayIso, 12);
  return { from: months[11], to: months[0] };
}

/** Nome do arquivo baixado da ficha: "ficha-0004-101.pdf" (o nome da unidade sem o que não é letra, número ou hífen). */
export function unitSheetPdfName(condominiumCode: number, unitName: string): string {
  const safe = unitName.normalize("NFD").replace(/[^a-zA-Z0-9-]+/g, "") || "unidade";
  return `ficha-${String(condominiumCode).padStart(4, "0")}-${safe}.pdf`;
}

/** Saldo de um boleto da ficha em palavras: "Vencido há 10 dias", "Pago em 05/10/2026" ou o próprio estado. */
export function boletoNote(boleto: { is_overdue: boolean; days_overdue: number; status: string; paid_on: string | null }): string {
  if (boleto.is_overdue) return `há ${boleto.days_overdue} ${boleto.days_overdue === 1 ? "dia" : "dias"}`;
  if (boleto.status === "paid" && boleto.paid_on) return `pago em ${boleto.paid_on.split("-").reverse().join("/")}`;
  return "";
}
