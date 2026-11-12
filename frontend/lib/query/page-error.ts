import { isAxiosError } from "axios";
import { notFound } from "next/navigation";

/** Falhas de carregamento que a tela de erro explica melhor que um formulário vazio: sem permissão, removido, limite de pedidos, servidor ou rede. */
function isPageError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status === 403 || status === 410 || status === 429 || status >= 500;
}

/**
 * Numa página de detalhe renderizada no cliente, uma falha ao carregar o registro vira tela de erro em vez de um
 * formulário vazio: 404 (não existe, ou é de outra empresa) é a página "não encontrada"; 403, 410, 429, 5xx e falha
 * de rede sobem para o `error.tsx`, que mostra a tela do código (`errorScreenCodeOf`). Qualquer outro erro segue o
 * fluxo normal da consulta. Chame durante a renderização, com o `error` da consulta do registro.
 */
export function throwIfPageError(error: unknown): void {
  if (isAxiosError(error) && error.response?.status === 404) notFound();
  if (isPageError(error)) throw error;
}
