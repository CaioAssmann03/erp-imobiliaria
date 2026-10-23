import type { Metadata } from "next";

import { AccountsPayableTable } from "../_components/AccountsPayableTable";
import { LinkButton } from "@/components/LinkButton";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Contas a pagar" };

export default function AccountsPayablePage() {
  return (
    <div>
      <PageHeader
        title="Contas a pagar"
        description="Despesas dos condomínios e da empresa."
        actions={<LinkButton href="/finance/accounts-payable/new">Nova conta a pagar</LinkButton>}
      />
      <AccountsPayableTable />
    </div>
  );
}
