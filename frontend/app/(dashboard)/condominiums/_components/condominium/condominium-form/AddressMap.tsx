"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { addressQuery, isAddressMappable, mapsEmbedUrl, mapsKeylessEmbedUrl } from "@/lib/condominiums/maps";
import type { CondominiumFormInput } from "@/lib/schemas/condominium";

const ADDRESS_FIELDS = ["zip_code", "street", "number", "district", "city", "state"] as const;
const MAP_DELAY_MS = 600;

/**
 * O mapa do Google sob o endereço do formulário: o CEP preenche o endereço (ViaCEP) e o mapa acompanha os
 * campos 600 ms depois da última tecla. Com `GOOGLE_MAPS_EMBED_KEY` usa a Maps Embed API; sem a chave usa o
 * embed do Google sem chave (não oficial), para o mapa aparecer de qualquer jeito.
 * Só para o endereço de um condomínio: o endereço de uma pessoa iria para o Google (spec 021).
 */
export function AddressMap({ apiKey }: { apiKey?: string }) {
  const { control } = useFormContext<CondominiumFormInput>();
  const [zip_code, street, number, district, city, state] = useWatch({ control, name: ADDRESS_FIELDS });
  const address = { zip_code, street, number, district, city, state };
  const query = useDebouncedValue(isAddressMappable(address) ? addressQuery(address) : "", MAP_DELAY_MS);

  if (!query) return null;

  return (
    <iframe
      title="Mapa do endereço do condomínio"
      src={apiKey ? mapsEmbedUrl(apiKey, query) : mapsKeylessEmbedUrl(query)}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      className="h-64 w-full rounded-panel border border-border"
    />
  );
}
