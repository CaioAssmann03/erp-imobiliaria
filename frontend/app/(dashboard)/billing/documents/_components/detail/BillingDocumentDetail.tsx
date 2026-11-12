"use client";

import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useBillingDocumentsRetrieve } from "@/lib/api/generated";
import { throwIfPageError } from "@/lib/query/page-error";

import { BillingDocumentView } from "./BillingDocumentView";

/** Client Component: busca o documento e mostra a `BillingDocumentView`; um 404 vira a página "não encontrada". */
export function BillingDocumentDetail({ documentId }: { documentId: string }) {
  const { data: document, error } = useBillingDocumentsRetrieve(documentId);
  throwIfPageError(error);

  if (!document) return <FormSkeleton sections={3} />;
  return <BillingDocumentView document={document} />;
}
