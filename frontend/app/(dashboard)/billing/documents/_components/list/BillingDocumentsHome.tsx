"use client";

import { useDocumentsScope } from "./use-documents-scope";

/** Client Component: a tela vazia dos documentos de cobrança, em largura total e sem o menu da direita: o que fazer a seguir. */
export function BillingDocumentsHome() {
  const scope = useDocumentsScope();

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{scope.condominium === "" ? "Escolha o condomínio" : "Escolha um documento"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {scope.condominium === ""
          ? "Os boletos emitidos para cada unidade, mês a mês. Escolha o condomínio na lista para ver os documentos dele."
          : "Abra um boleto emitido na lista para ver o boleto, os itens e as ações. Os documentos nascem da emissão do mês e do boleto extra."}
      </p>
    </div>
  );
}
