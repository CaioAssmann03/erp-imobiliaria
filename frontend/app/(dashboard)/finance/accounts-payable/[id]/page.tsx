import type { Metadata } from "next";

import { AccountPayableForm } from "../_components/AccountPayableForm";
import { AccountPayableHeader } from "../_components/AccountPayableHeader";

export const metadata: Metadata = { title: "Conta a pagar" };

export default async function EditAccountPayablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <AccountPayableHeader accountId={id} />
      <AccountPayableForm accountId={id} />
    </>
  );
}
