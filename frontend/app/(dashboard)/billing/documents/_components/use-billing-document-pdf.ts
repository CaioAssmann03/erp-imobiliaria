"use client";

import { isAxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";

import { billingDocumentsPdf, billingDocumentsPdf2 } from "@/lib/api/generated";
import type { BillingDocumentPdfDownload } from "@/lib/api/generated/models";
import { apiErrorMessage } from "@/lib/form-errors";

const NOT_GENERATED = "billing_document_pdf.not_generated";

/** O PDF é gerado por uma tarefa depois da emissão: se ainda não existe (404 coded), gera agora. */
function isNotGenerated(error: unknown): boolean {
  if (!isAxiosError(error) || error.response?.status !== 404) return false;
  const errors = (error.response.data as { errors?: { code?: string }[] } | undefined)?.errors;
  return errors?.[0]?.code === NOT_GENERATED;
}

/** Baixa o PDF de rascunho do documento: pede a URL assinada (gerando o PDF antes, se faltar) e abre o download. */
export function useBillingDocumentPdf(documentId: string) {
  const [isPending, setIsPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const download = async () => {
    setIsPending(true);
    try {
      let result: BillingDocumentPdfDownload;
      try {
        result = await billingDocumentsPdf(documentId);
      } catch (error) {
        if (!isNotGenerated(error)) throw error;
        setIsGenerating(true);
        result = await billingDocumentsPdf2(documentId);
      }
      window.location.assign(result.download_url);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível obter o PDF."));
    } finally {
      setIsPending(false);
      setIsGenerating(false);
    }
  };

  return { download, isPending, isGenerating };
}
