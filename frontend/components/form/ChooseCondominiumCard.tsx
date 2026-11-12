"use client";

import { CondominiumField } from "./CondominiumField";

/**
 * A tela de um cadastro novo que ainda não sabe o condomínio (o **+** da lista sem condomínio escolhido): um cartão só com o campo do condomínio. Escolhê-lo
 * (`onChoose`) leva ao formulário daquele condomínio, e a lista da esquerda o segue.
 */
export function ChooseCondominiumCard({ what, onChoose }: { what: string; onChoose: (condominium: string) => void }) {
  return (
    <div className="rounded-card bg-card p-6 shadow-card">
      <p className="mb-5 text-body text-ink-soft">{`Escolha o condomínio ${what} para continuar.`}</p>
      <CondominiumField value="" onChange={onChoose} className="max-w-md" />
    </div>
  );
}
