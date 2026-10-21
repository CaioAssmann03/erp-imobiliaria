/**
 * Textos e regras de exibição dos documentos e das execuções de cobrança.
 * Funções puras, sem imports do app: rodam direto no `node --test`.
 */

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  issued: "Emitido",
  registered: "Registrado",
  paid: "Pago",
  cancelled: "Cancelado",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  running: "Em andamento",
  succeeded: "Concluída",
  partial: "Parcial",
  failed: "Falhou",
};

/** O vencido é derivado da data (a API devolve `is_overdue`), não um status guardado. */
export const documentStatusLabel = (status: string, isOverdue = false): string =>
  isOverdue ? "Vencido" : (DOCUMENT_STATUS_LABELS[status] ?? status);

export const runStatusLabel = (status: string): string => RUN_STATUS_LABELS[status] ?? status;

/** Só um documento emitido ou registrado pode ser cancelado (o servidor confere de novo). */
export const canCancelDocument = (status: string): boolean => status === "issued" || status === "registered";

export const INTEREST_CALCULATION_LABELS: Record<string, string> = {
  full_month: "Mês cheio",
  per_day: "Por dia de atraso",
};
