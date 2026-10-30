"use client";

import { useCompanyEntriesBalance } from "@/lib/api/generated";
import { brl } from "@/lib/format/format";

/** Client Component: o saldo da imobiliária (a soma de todos os lançamentos dela) em tipo grande, com o que ele é em uma linha. */
export function CompanyBalance() {
  const { data: balance } = useCompanyEntriesBalance();

  return (
    <div className="rounded-card bg-surface p-5 sm:p-6">
      <p className="text-display tabular-nums" aria-label={balance ? `Saldo da imobiliária: ${brl(balance.balance)}` : "Saldo da imobiliária"}>
        {balance ? brl(balance.balance) : "–"}
      </p>
      <p className="mt-3 max-w-md text-body text-ink-soft">
        O que é da própria imobiliária, como a tarifa de registro dos boletos pagos. Nunca entra na conta de um condomínio. Escolha um lançamento na lista para ver os detalhes.
      </p>
    </div>
  );
}
