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

export interface RunCounts {
  issued_count: number;
  already_issued_count: number;
}

/** Uma execução que não emitiu nada e não encontrou nada já emitido (o mês ficou sem documento nenhum). */
export const issuedNothing = (run: RunCounts): boolean => run.issued_count === 0 && run.already_issued_count === 0;

/**
 * "Concluída" só quer dizer que nenhuma unidade falhou: sem emissão nenhuma (as unidades foram puladas) o rótulo
 * avisa isso, para não parecer que os boletos foram gerados.
 */
export const runStatusLabel = (status: string, counts?: RunCounts): string =>
  status === "succeeded" && counts && issuedNothing(counts) ? "Concluída sem emissão" : (RUN_STATUS_LABELS[status] ?? status);

/** Só um documento emitido ou registrado pode ser cancelado (o servidor confere de novo). */
export const canCancelDocument = (status: string): boolean => status === "issued" || status === "registered";

export const INTEREST_CALCULATION_LABELS: Record<string, string> = {
  full_month: "Mês cheio",
  per_day: "Por dia de atraso",
};

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando envio",
  sent: "Enviado",
  delivered: "Entregue",
  failed: "Falhou",
};

const DELIVERY_FAILURE_LABELS: Record<string, string> = {
  payer_without_email: "o pagador não tem e-mail cadastrado",
  email_not_configured: "o envio de e-mail não está configurado",
  provider_rejected: "o provedor recusou a mensagem",
  bounced: "o e-mail voltou (endereço inválido ou caixa cheia)",
  complained: "o destinatário marcou como spam",
};

export const deliveryStatusLabel = (status: string): string => DELIVERY_STATUS_LABELS[status] ?? status;

/** Por que um envio falhou, em português (um código desconhecido aparece como está). */
export const deliveryFailureLabel = (reason: string): string => DELIVERY_FAILURE_LABELS[reason] ?? reason;

export interface BoletoState {
  status: string;
  hasRegistration: boolean;
}

/**
 * Em que pé está o boleto de um documento: `waiting` (emitido, ainda sem registro no gateway), `active` (pode ser pago),
 * `cancelled` (registrado, mas o gateway cancelou a cobrança: precisa de reemissão), `paid` ou `none` (cancelado).
 */
export function boletoState({ status, hasRegistration }: BoletoState): "waiting" | "active" | "cancelled" | "paid" | "none" {
  if (status === "paid") return "paid";
  if (status === "cancelled") return "none";
  if (status === "issued") return "waiting";
  return hasRegistration ? "active" : "cancelled";
}

/** Só um documento registrado (com boleto ativo ou cancelado) pode ser reemitido (o servidor confere de novo). */
export const canReissueDocument = (status: string): boolean => status === "registered";
