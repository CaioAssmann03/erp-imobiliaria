/**
 * Auxiliares do mapa do endereço: o texto que o Google localiza, o endereço do iframe da Maps Embed API
 * e o link "Abrir no Maps". Funções puras, sem imports do app: rodam direto no `node --test`.
 */

/** Os campos do endereço de que o mapa precisa (como vêm do formulário, com máscara). */
export interface MapAddress {
  zip_code?: string;
  street?: string;
  number?: string;
  district?: string;
  city?: string;
  state?: string;
}

const clean = (part: string | undefined) => (part ?? "").replace(/\s+/g, " ").trim();
const digits = (value: string | undefined) => (value ?? "").replace(/\D/g, "");

/** Há o bastante para achar o lugar: um CEP de 8 dígitos, ou rua e cidade. */
export function isAddressMappable(address: MapAddress): boolean {
  return (
    digits(address.zip_code).length === 8 || (clean(address.street) !== "" && clean(address.city) !== "")
  );
}

/** "Rua A, 10, Centro, Curitiba - PR, 80010-000, Brasil": o texto que o Google transforma em lugar. */
export function addressQuery(address: MapAddress): string {
  const zip = digits(address.zip_code);
  return [
    [clean(address.street), clean(address.number)].filter(Boolean).join(", "),
    clean(address.district),
    [clean(address.city), clean(address.state)].filter(Boolean).join(" - "),
    zip.length === 8 ? `${zip.slice(0, 5)}-${zip.slice(5)}` : "",
    "Brasil",
  ]
    .filter(Boolean)
    .join(", ");
}

/** O iframe da Maps Embed API: modo "place", com o endereço em `q` (sem JavaScript, só a chave). */
export function mapsEmbedUrl(apiKey: string, query: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}`;
}

/** O link "Abrir no Maps": as URLs do Google Maps (`api=1`) não pedem chave. */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
