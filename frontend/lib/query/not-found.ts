import { isAxiosError } from "axios";
import { notFound } from "next/navigation";

/**
 * Numa página de detalhe renderizada no cliente, um 404 (o registro não existe, ou é de outra empresa) vira a
 * página "não encontrada" em vez de um formulário vazio; qualquer outro erro segue o fluxo normal da consulta.
 * Chame durante a renderização, com o `error` da consulta do registro.
 */
export function throwIfNotFound(error: unknown): void {
  if (isAxiosError(error) && error.response?.status === 404) notFound();
}
