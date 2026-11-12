"use client";

import { extraBillingUrl } from "@/lib/billing/extra-billing-workspace";

import { BillingDocumentHeader } from "../../documents/_components/BillingDocumentHeader";
import { BackLinkToExtra } from "./BackLinkToExtra";
import { useExtraScope } from "./use-extra-scope";

/** O boleto novo: só o título (o condomínio é o primeiro campo do formulário). */
export function NewExtraBillingHeader() {
  return (
    <>
      <BackLinkToExtra />
      <h1 className="mb-6 text-title">Novo boleto extra</h1>
    </>
  );
}

/** Client Component: o boleto extra emitido aberto: o mesmo cabeçalho dos Documentos, com o "voltar" do celular à lista dos boletos extras. */
export function ExtraBillingDocumentHeader({ documentId }: { documentId: string }) {
  const scope = useExtraScope();

  return <BillingDocumentHeader documentId={documentId} back={{ href: extraBillingUrl(scope), label: "Boleto extra" }} />;
}
