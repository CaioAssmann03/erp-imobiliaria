"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { addressQuery, isAddressMappable, mapsEmbedUrl, mapsSearchUrl } from "@/lib/maps";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

const ADDRESS_FIELDS = ["zip_code", "street", "number", "district", "city", "state"] as const;
const MAP_DELAY_MS = 600;

/**
 * O mapa do Google (Maps Embed API) sob o endereço do formulário: o CEP preenche o endereço (ViaCEP) e o
 * mapa acompanha os campos 600 ms depois da última tecla. Sem a chave, só o link "Abrir no Maps".
 * Só para o endereço de um condomínio: o endereço de uma pessoa iria para o Google (spec 021).
 */
export function AddressMap({ apiKey }: { apiKey?: string }) {
  const { control } = useFormContext<CondominiumFormInput>();
  const [zip_code, street, number, district, city, state] = useWatch({ control, name: ADDRESS_FIELDS });
  const address = { zip_code, street, number, district, city, state };
  const query = useDebouncedValue(isAddressMappable(address) ? addressQuery(address) : "", MAP_DELAY_MS);

  if (!query) return null;

  return (
    <div className="space-y-2">
      {apiKey && (
        <iframe
          title="Mapa do endereço do condomínio"
          src={mapsEmbedUrl(apiKey, query)}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-64 w-full rounded-panel border border-border"
        />
      )}
      <a
        href={mapsSearchUrl(query)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-caption text-brand hover:underline"
      >
        Abrir no Maps
      </a>
    </div>
  );
}
