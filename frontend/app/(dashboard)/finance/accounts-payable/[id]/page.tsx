import type { Metadata } from "next";

import { AccountPayableForm } from "../../_components/AccountPayableForm";
import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Conta a pagar" };

export default async function EditAccountPayablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <FormPage>
      <PageHeader back={{ href: "/finance/accounts-payable", label: "Contas a pagar" }} title="Conta a pagar" />
      <AccountPayableForm accountId={id} />
    </FormPage>
  );
}
