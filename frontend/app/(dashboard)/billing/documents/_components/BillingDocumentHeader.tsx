"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { useBillingDocumentsRetrieve } from "@/lib/api/generated";
import { formatMonth } from "@/lib/format/format";

/**
 * Client Component: o documento aberto: a unidade e, em cinza, o pagador, a competência e, se for o caso, "Boleto extra". Usa a mesma consulta da tela do documento
 * (uma só chamada). No celular, onde a lista não fica ao lado, tem o "voltar" a ela no alto. Serve aos Documentos e ao Boleto extra, cada um com a sua lista.
 */
export function BillingDocumentHeader({ documentId, back }: { documentId: string; back: { href: string; label: string } }) {
  const { data: document } = useBillingDocumentsRetrieve(documentId);

  return (
    <>
      <div className="lg:hidden">
        <BackLink href={back.href} label={back.label} />
      </div>
      {document ? (
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-title">Unidade {document.unit_name}</h1>
          <span className="text-body text-ink-soft">
            {[document.payer_name, formatMonth(document.competence_month), document.kind === "extra" ? "Boleto extra" : null].filter(Boolean).join(" · ")}
          </span>
        </div>
      ) : (
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      )}
    </>
  );
}
