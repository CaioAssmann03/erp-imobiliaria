"use client";

import { billingDocumentsUrl } from "@/lib/billing/billing-document-workspace";

import { BillingDocumentHeader } from "@/app/(dashboard)/billing/documents/_components/BillingDocumentHeader";
import { useDocumentsScope } from "@/app/(dashboard)/billing/documents/_components/list/use-documents-scope";

/** O cabeçalho do documento aberto nos Documentos: o "voltar" do celular leva à lista com o mesmo escopo. */
export function DocumentPageHeader({ documentId }: { documentId: string }) {
  const scope = useDocumentsScope();

  return <BillingDocumentHeader documentId={documentId} back={{ href: billingDocumentsUrl(scope), label: "Documentos de cobrança" }} />;
}
