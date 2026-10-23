"use client";

import { FormSkeleton } from "@/components/form/FormSkeleton";
import { useBillingDocumentsRetrieve } from "@/lib/api/generated";
import { throwIfNotFound } from "@/lib/query/not-found";

import { BillingDocumentView } from "./BillingDocumentView";

/** Client Component: busca o documento e mostra a `BillingDocumentView`; um 404 vira a página "não encontrada". */
export function BillingDocumentDetail({ documentId }: { documentId: string }) {
  const { data: document, error } = useBillingDocumentsRetrieve(documentId);
  throwIfNotFound(error);

  if (!document) return <FormSkeleton sections={3} />;
  return <BillingDocumentView document={document} />;
}
