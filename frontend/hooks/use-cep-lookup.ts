import { useQuery } from "@tanstack/react-query";

import { onlyDigits } from "@/lib/format/masks";

export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

/**
 * Consulta o ViaCEP quando o CEP tem 8 dígitos. Cache por CEP (o endereço de um CEP
 * quase não muda) e requisição cancelada se o usuário continuar digitando.
 * `data === null` significa CEP inexistente.
 */
export function useCepLookup(cep: string | undefined) {
  const digits = onlyDigits(cep ?? "");

  return useQuery({
    queryKey: ["cep", digits],
    enabled: digits.length === 8,
    staleTime: Infinity,
    retry: false,
    queryFn: async ({ signal }): Promise<CepAddress | null> => {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal });
      if (!response.ok) throw new Error("Falha ao consultar o CEP");
      const data = await response.json();
      if (data.erro) return null;
      return {
        // O ViaCEP responde em português; aqui já convertemos para os nomes do formulário.
        street: data.logradouro ?? "",
        district: data.bairro ?? "",
        city: data.localidade ?? "",
        state: data.uf ?? "",
      };
    },
  });
}
