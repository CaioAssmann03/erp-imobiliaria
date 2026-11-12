import type { Metadata } from "next";

import { BackLinkToEntries } from "../_components/BackLinkToEntries";
import { NewBillingEntryForm } from "../_components/NewBillingEntryForm";

export const metadata: Metadata = { title: "Novo lançamento" };

export default function NewBillingEntryPage() {
  return (
    <>
      <BackLinkToEntries />
      <div className="mb-6">
        <h1 className="text-title">Novo lançamento</h1>
        <p className="mt-1 text-body text-ink-soft">Valores que entram no boleto de cada unidade, além do plano de cobrança.</p>
      </div>
      <NewBillingEntryForm />
    </>
  );
}
