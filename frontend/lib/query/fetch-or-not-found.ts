import { isAxiosError } from "axios";
import type { FetchQueryOptions, QueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";

/**
 * Busca no servidor o registro de uma página de detalhe e deixa o resultado no cache que vai hidratar o cliente.
 * Um 404 (o registro não existe, ou é de outra empresa) vira a página "não encontrada" em vez de um formulário
 * vazio; qualquer outro erro sobe para a tela de erro da página, que oferece tentar de novo.
 */
export async function fetchOrNotFound<T>(queryClient: QueryClient, options: FetchQueryOptions<T, Error, T, readonly unknown[]>): Promise<T> {
  try {
    return await queryClient.fetchQuery(options);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }
}
