"use client";

import { useCondominiumsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { extraBillingUrl } from "@/lib/billing/extra-billing-workspace";

import { BillingDocumentHeader } from "../../documents/_components/BillingDocumentHeader";
import { BackLinkToExtra } from "./BackLinkToExtra";
import { useExtraScope } from "./use-extra-scope";

function Title({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <h1 className="text-title">{title}</h1>
      {detail && <span className="text-body text-ink-soft">{detail}</span>}
    </div>
  );
}

/** Client Component: o boleto novo, com o condomínio da lista em cinza ao lado do título (no formulário ele não se repete). */
export function NewExtraBillingHeader() {
  const scope = useExtraScope();
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const condominium = condominiums?.results.find((item) => item.id === scope.condominium);

  return (
    <>
      <BackLinkToExtra />
      <Title title="Novo boleto extra" detail={condominium ? `${formatCode(condominium.code)} · ${condominium.name}` : undefined} />
    </>
  );
}

/** Client Component: o boleto extra emitido aberto: o mesmo cabeçalho dos Documentos, com o "voltar" do celular à lista dos boletos extras. */
export function ExtraBillingDocumentHeader({ documentId }: { documentId: string }) {
  const scope = useExtraScope();

  return <BillingDocumentHeader documentId={documentId} back={{ href: extraBillingUrl(scope), label: "Boleto extra" }} />;
}
