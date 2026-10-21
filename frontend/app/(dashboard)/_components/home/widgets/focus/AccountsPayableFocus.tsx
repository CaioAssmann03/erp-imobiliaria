import { LinkButton } from "@/components/LinkButton";
import { getAccountsPayableListQueryOptions } from "@/lib/api/generated";
import type { AccountsPayable } from "@/lib/api/generated/models";
import { getServerQueryClient } from "@/lib/query/server";

import { brl } from "../format";
import { OpenAccountsList } from "./OpenAccountsList";
import { FocusSection, FocusStat } from "./parts";

const countLabel = (count: number) => `${count} ${count === 1 ? "conta" : "contas"}`;
const LIST_LIMIT = 100;

/**
 * Server Component: os totais por janela e as contas em aberto, buscados no servidor. Só o filtro por vencimento
 * (`OpenAccountsList`) é client.
 */
export async function AccountsPayableFocus({ payables }: { payables: AccountsPayable | undefined }) {
  const queryClient = getServerQueryClient();
  const open = await queryClient
    .fetchQuery(getAccountsPayableListQueryOptions({ status: "open", limit: LIST_LIMIT }))
    .catch(() => undefined);
  const accounts = [...(open?.results ?? [])]
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .map((account) => ({
      id: account.id,
      description: account.description,
      supplierName: account.supplier_name,
      condominiumName: account.condominium_name ?? null,
      dueDate: account.due_date,
      amount: account.amount,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FocusStat
          label="Atrasadas"
          value={payables ? brl(payables.overdue.total) : "–"}
          tone={(payables?.overdue.count ?? 0) > 0 ? "danger" : "default"}
          hint={payables ? countLabel(payables.overdue.count) : undefined}
        />
        <FocusStat label="Vencem hoje" value={payables ? brl(payables.due_today.total) : "–"} hint={payables ? countLabel(payables.due_today.count) : undefined} />
        <FocusStat label="Próximos 7 dias" value={payables ? brl(payables.due_next_7_days.total) : "–"} hint={payables ? countLabel(payables.due_next_7_days.count) : undefined} />
        <FocusStat label="Neste mês" value={payables ? brl(payables.due_this_month.total) : "–"} hint={payables ? countLabel(payables.due_this_month.count) : undefined} />
      </div>

      <FocusSection title="Contas em aberto" action={{ href: "/finance/accounts-payable", label: "Ver todas" }}>
        {open ? <OpenAccountsList accounts={accounts} total={open.count} /> : <p className="py-6 text-ink-soft">Não foi possível carregar as contas.</p>}
      </FocusSection>

      <LinkButton variant="secondary" href="/finance/accounts-payable/new">
        Nova conta a pagar
      </LinkButton>
    </div>
  );
}
