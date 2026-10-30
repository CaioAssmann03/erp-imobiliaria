/**
 * O que a API respondeu a um erro, para o aviso (toast) mostrar mais quando a pessoa clica nele: o status, a requisição e, para cada erro,
 * o código, o campo e a mensagem original do servidor. Quem transforma o erro em texto (`applyServerErrors`, `apiErrorMessage`) registra os detalhes
 * junto com a mensagem; o `toast.error` (`lib/toast.tsx`) os pega logo em seguida, na mesma chamada, pela mensagem.
 */
export interface ErrorDetailItem {
  field: string | null;
  code: string;
  message: string;
}

export interface ErrorDetails {
  /** O status HTTP; vazio quando o servidor não respondeu (sem conexão). */
  status: number | null;
  /** "DELETE /api/persons/…/": só o método e o caminho, nunca o corpo. */
  request: string | null;
  items: ErrorDetailItem[];
}

const RECENT_MS = 2000;
const recorded = new Map<string, { details: ErrorDetails; at: number }>();

export function recordErrorDetails(message: string, details: ErrorDetails): void {
  recorded.set(message, { details, at: Date.now() });
}

/** Os detalhes registrados para esta mensagem há pouco (e os esquece): o aviso que acabou de nascer dela. */
export function takeErrorDetails(message: string): ErrorDetails | undefined {
  const found = recorded.get(message);
  recorded.delete(message);
  return found && Date.now() - found.at < RECENT_MS ? found.details : undefined;
}
