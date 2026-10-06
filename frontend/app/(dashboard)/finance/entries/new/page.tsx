import type { Metadata } from "next";

import { NewEntriesForm } from "../../_components/NewEntriesForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Lançamento manual" };

export default function NewEntriesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        back={{ href: "/finance/statement", label: "Extrato" }}
        title="Lançamento manual"
        description="Tarifas, ajustes e outros movimentos fora de contas a pagar."
      />
      <NewEntriesForm />
    </div>
  );
}
