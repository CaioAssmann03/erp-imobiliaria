import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { statementUrl } from "@/lib/finance/statement-workspace";
import { uuidParam } from "@/lib/api/uuid-param";

export const metadata: Metadata = { title: "Extrato" };

/** A tela vazia do extrato. O endereço antigo `?condominium=<id>` (de links e atalhos) abre direto o extrato daquele condomínio. */
export default async function StatementPage({ searchParams }: { searchParams: Promise<{ condominium?: string }> }) {
  const condominiumId = uuidParam((await searchParams).condominium ?? null);
  if (condominiumId) redirect(statementUrl(condominiumId));

  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 rounded-card bg-surface p-10 text-center">
      <h1 className="text-heading">Escolha um condomínio</h1>
      <p className="max-w-sm text-body text-ink-soft">
        Selecione um condomínio na lista para ver o saldo e os lançamentos da conta corrente dele.
      </p>
    </div>
  );
}
