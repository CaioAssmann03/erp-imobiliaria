"use client";

import { usePlansScope } from "./use-plans-scope";

/** Client Component: a tela vazia dos planos, em largura total e sem o menu da direita: o que fazer a seguir. */
export function BillingPlansHome() {
  const scope = usePlansScope();

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha um plano</h1>
      <p className="max-w-sm text-body text-ink-soft">
        {scope.condominium === ""
          ? "O plano diz o que compõe o boleto mensal de cada unidade do condomínio. Abra um na lista ou use o + para cadastrar um novo."
          : "Abra um plano deste condomínio na lista ou use o + para cadastrar um novo."}
      </p>
    </div>
  );
}
