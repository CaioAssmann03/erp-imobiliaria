/**
 * A chave da Maps Embed API (`GOOGLE_MAPS_EMBED_KEY`), lida no servidor a cada requisição pelas páginas do
 * condomínio e passada ao formulário: sem o prefixo `NEXT_PUBLIC_`, trocar a chave pede reiniciar o
 * servidor, não refazer o build. Vazia ou ausente: o formulário usa o embed do Google sem chave (não oficial).
 */
export function getMapsEmbedKey(): string | undefined {
  return process.env.GOOGLE_MAPS_EMBED_KEY?.trim() || undefined;
}
