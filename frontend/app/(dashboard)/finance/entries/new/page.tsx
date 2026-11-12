import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { entriesUrl } from "@/lib/finance/entry-batch-workspace";

import { NewEntriesForm } from "../_components/NewEntriesForm";

export const metadata: Metadata = { title: "Novo lote" };

export default function NewEntriesPage() {
  return (
    <>
      <div className="mb-6">
        <PhoneBackLink href={entriesUrl()} label="Lançamento manual" />
        <h1 className="text-title">Novo lote</h1>
        <p className="mt-1 text-body text-ink-soft">Tarifas, ajustes e outros movimentos fora de contas a pagar.</p>
      </div>
      <NewEntriesForm />
    </>
  );
}
