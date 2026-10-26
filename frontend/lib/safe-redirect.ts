/**
 * Destino de `?next=` só pode ser um caminho interno ("/condominiums"), nunca uma URL externa
 * ("https://..." ou "//host"), para o login não virar um redirecionamento aberto.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
