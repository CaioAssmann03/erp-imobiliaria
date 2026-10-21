"use client";

import { Button } from "@/components/ui/button";
import type { BillingDocument } from "@/lib/api/generated/models";
import { canCancelDocument } from "@/lib/billing-documents";

import { CancelBillingDocumentButton } from "./CancelBillingDocumentButton";
import { useBillingDocumentPdf } from "./use-billing-document-pdf";

/** PDF de rascunho (baixa, gerando antes se preciso) e cancelamento (só emitido ou registrado). */
export function BillingDocumentActions({ document }: { document: BillingDocument }) {
  const { download, isPending, isGenerating } = useBillingDocumentPdf(document.id);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" disabled={isPending} onClick={download}>
        {isGenerating ? "Gerando PDF…" : isPending ? "Abrindo…" : "Baixar PDF"}
      </Button>
      {canCancelDocument(document.status) && <CancelBillingDocumentButton document={document} />}
    </div>
  );
}
