import Link from "next/link";

import { accountPayableUrl } from "@/lib/account-payable-workspace";
import type { AccountPayable } from "@/lib/api/generated/models";
import { brl, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A segunda linha da conta na lista: o vencimento (vencida em vermelho), ou quando foi paga, e o valor. */
function SubLine({ account, today }: { account: AccountPayable; today: string }) {
  if (account.status === "cancelled") return <>Cancelada · {brl(account.amount)}</>;
  if (account.status === "paid") return <>Paga em {formatDate(account.payment_date ?? account.due_date)} · {brl(account.amount_paid ?? account.amount)}</>;
  if (account.due_date < today) {
    return (
      <>
        <span className="text-danger">Vencida em {formatDate(account.due_date)}</span> · {brl(account.amount)}
      </>
    );
  }
  return <>Vence {formatDate(account.due_date)} · {brl(account.amount)}</>;
}

/**
 * Uma conta na lista no padrão da lista de condomínios: a descrição em cima e embaixo o vencimento e o valor, sem selo de situação.
 * `isOpen` marca a aberta e `dimmed` apaga as outras quando há uma aberta (voltam ao passar o mouse ou focar).
 */
export function AccountPayableListItem({
  account,
  today,
  isOpen = false,
  dimmed = false,
}: {
  account: AccountPayable;
  today: string;
  isOpen?: boolean;
  dimmed?: boolean;
}) {
  return (
    <li>
      <Link
        href={accountPayableUrl(account.id)}
        aria-current={isOpen ? "page" : undefined}
        className={cn(
          "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
          isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
          dimmed && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        <span className="block truncate text-body font-medium">{account.description}</span>
        <span className="block truncate text-caption tabular-nums text-ink-soft">
          <SubLine account={account} today={today} />
        </span>
      </Link>
    </li>
  );
}
