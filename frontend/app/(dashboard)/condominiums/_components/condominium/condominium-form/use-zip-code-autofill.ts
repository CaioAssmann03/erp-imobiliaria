"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { useCepLookup } from "@/hooks/use-cep-lookup";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

const ADDRESS_FIELDS = ["street", "district", "city", "state"] as const;

/**
 * Preenche o endereço a partir do CEP digitado. O CEP vem só da digitação do usuário (não muda
 * ao carregar/resetar o formulário), então a busca dispara no 8º dígito e nunca sobrescreve um
 * endereço já salvo.
 */
export function useZipCodeAutofill() {
  const { setValue, setError, clearErrors } = useFormContext<CondominiumFormInput>();
  const [typedZipCode, setTypedZipCode] = useState("");
  const lookup = useCepLookup(typedZipCode);
  const address = lookup.data;

  useEffect(() => {
    if (address === null) {
      setError("zip_code", { type: "lookup", message: "CEP não encontrado" });
      return;
    }
    if (!address) return;
    clearErrors("zip_code");
    for (const field of ADDRESS_FIELDS) {
      // CEPs genéricos não trazem logradouro/bairro: mantém o que o usuário digitou.
      if (address[field]) {
        setValue(field, address[field], { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [address, typedZipCode, setValue, setError, clearErrors]);

  const hint = lookup.isFetching
    ? "Buscando endereço…"
    : lookup.isError
      ? "Não foi possível buscar. Preencha manualmente."
      : undefined;

  return { onZipCodeChange: setTypedZipCode, hint };
}
