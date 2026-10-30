"use client";

import { SectionIndex } from "@/components/layout/SectionIndex";
import { useAccountsPayableRetrieve } from "@/lib/api/generated";
import { payableSections } from "@/lib/finance/account-payable-workspace";

/**
 * Client Component: o índice da direita da conta aberta. Uma conta em aberto (e a nova) é um formulário, com as seções Despesa e Conta; uma
 * paga ou cancelada só se consulta, com o resumo e, se paga, os comprovantes. Usa a mesma consulta do formulário (uma só chamada).
 */
export function AccountPayableSideMenu({ accountId }: { accountId: string | null }) {
  const { data: account } = useAccountsPayableRetrieve(accountId ?? "", { query: { enabled: accountId !== null } });

  return <SectionIndex sections={payableSections(account?.status)} label="Seções da conta" title="Nesta conta" />;
}
