"use client";

import { useExtraScope } from "./use-extra-scope";

/** Client Component: a tela vazia do boleto extra, em largura total e sem o menu da direita: o que fazer a seguir, conforme haja condomínio escolhido. */
export function ExtraBillingHome() {
  const scope = useExtraScope();

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">{scope.condominium === "" ? "Escolha o condomínio" : "Escolha um boleto extra"}</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {scope.condominium === ""
          ? "Um boleto avulso, fora da emissão do mês: obra, multa ou qualquer cobrança com vencimento próprio. Escolha o condomínio na lista para ver os já emitidos e emitir um novo."
          : "Abra um boleto emitido na lista ou use o + para emitir um novo."}
      </p>
    </div>
  );
}
