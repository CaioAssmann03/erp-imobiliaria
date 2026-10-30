"use client";

import { useRunsScope } from "./use-runs-scope";

/** Client Component: a tela vazia das execuções, em largura total e sem o menu da direita: o que fazer a seguir. */
export function BillingRunsHome() {
  const scope = useRunsScope();

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{scope.condominium === "" ? "Escolha o condomínio" : "Escolha uma execução"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {scope.condominium === ""
          ? "O que cada emissão mensal fez: documentos emitidos, unidades puladas e o motivo. Escolha o condomínio na lista para ver as execuções dele."
          : "Abra uma execução na lista para ver as contagens e os problemas, ou use o + para emitir o mês agora."}
      </p>
    </div>
  );
}
