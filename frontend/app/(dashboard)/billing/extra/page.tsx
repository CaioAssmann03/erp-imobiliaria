import type { Metadata } from "next";

import { PageHeader } from "@/components/PageHeader";

import { ExtraBillingForm } from "./_components/ExtraBillingForm";

export const metadata: Metadata = { title: "Boleto extra" };

export default function ExtraBillingPage() {
  return (
    <>
      <PageHeader
        title="Boleto extra"
        description="Um boleto avulso, fora da emissão do mês, para uma ou mais unidades: obra, multa ou qualquer cobrança com vencimento próprio."
      />
      <ExtraBillingForm />
    </>
  );
}
