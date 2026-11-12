import { formatFileSize } from "@/lib/format/format";

/** Mesmas regras do backend (spec 018); lá elas são conferidas de novo. Aqui só evitam um envio inútil. */
export const RECEIPT_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const RECEIPT_ACCEPT = RECEIPT_CONTENT_TYPES.join(",");
export const MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024;

/** Mensagem de por que o arquivo não serve, ou `null` quando ele pode ser enviado. */
export function receiptFileProblem(file: File): string | null {
  if (!(RECEIPT_CONTENT_TYPES as readonly string[]).includes(file.type)) {
    return "O comprovante deve ser um arquivo PDF, JPEG ou PNG.";
  }
  if (file.size === 0) return "O arquivo não pode estar vazio.";
  if (file.size > MAX_RECEIPT_SIZE_BYTES) {
    return `O arquivo (${formatFileSize(file.size)}) é maior que o limite de ${formatFileSize(MAX_RECEIPT_SIZE_BYTES)}.`;
  }
  return null;
}

/**
 * Envia o arquivo direto ao bucket pela URL assinada que o backend emitiu. É a única chamada que não vai
 * pela API do ERP (nem pelo cliente gerado): a URL já traz a assinatura, então não leva o token da sessão.
 */
export async function uploadToBucket(uploadUrl: string, headers: Record<string, string>, file: File): Promise<void> {
  const response = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!response.ok) throw new Error(`O envio ao armazenamento falhou (${response.status}).`);
}
