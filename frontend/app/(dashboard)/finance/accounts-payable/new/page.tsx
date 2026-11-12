import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { accountsPayableUrl } from "@/lib/finance/account-payable-workspace";

import { AccountPayableForm } from "../_components/AccountPayableForm";

export const metadata: Metadata = { title: "Nova conta a pagar" };

export default function NewAccountPayablePage() {
  return (
    <>
      <div className="mb-6">
        <PhoneBackLink href={accountsPayableUrl()} label="Contas a pagar" />
        <h1 className="text-title">Nova conta a pagar</h1>
      </div>
      <AccountPayableForm />
    </>
  );
}
