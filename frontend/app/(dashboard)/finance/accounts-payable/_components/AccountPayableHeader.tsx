"use client";

import { BackLink } from "@/components/layout/BackLink";
import { Skeleton } from "@/components/ui/skeleton";
import { accountsPayableUrl } from "@/lib/finance/account-payable-workspace";
import { useAccountsPayableRetrieve } from "@/lib/api/generated";
import { payableStatusLabel } from "@/lib/schemas/account-payable";
import { todayIso } from "@/lib/format/format";
import { cn } from "@/lib/utils";

/**
 * Client Component: a descrição da conta aberta, a situação em texto simples (vencida em vermelho, paga em verde) e, embaixo, o fornecedor e de quem é
 * a despesa. Usa a mesma consulta do formulário (uma só chamada). No celular, onde a lista não fica ao lado, tem o "voltar" à lista no alto.
 */
export function AccountPayableHeader({ accountId }: { accountId: string }) {
  const { data: account } = useAccountsPayableRetrieve(accountId);

  const back = (
    <div className="lg:hidden">
      <BackLink href={accountsPayableUrl()} label="Contas a pagar" />
    </div>
  );

  if (!account)
    return (
      <>
        {back}
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      </>
    );

  const overdue = account.status === "open" && account.due_date < todayIso();

  return (
    <>
      {back}
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-title">{account.description}</h1>
          <span
            className={cn(
              "text-body font-medium",
              overdue ? "text-danger" : account.status === "paid" ? "text-success" : account.status === "cancelled" ? "text-ink-faint" : "text-ink"
            )}
          >
            {overdue ? "Vencida" : payableStatusLabel(account.status)}
          </span>
        </div>
        <p className="mt-1 text-body text-ink-soft">
          {account.supplier_name} <span className="text-ink-faint">·</span> {account.condominium_name || "Despesa da empresa"}
        </p>
      </div>
    </>
  );
}
