import type { Metadata } from "next";

import { NewExtraBillingHeader } from "../_components/ExtraBillingHeader";
import { ExtraBillingForm } from "../_components/ExtraBillingForm";

export const metadata: Metadata = { title: "Novo boleto extra" };

export default function NewExtraBillingPage() {
  return (
    <>
      <NewExtraBillingHeader />
      <ExtraBillingForm />
    </>
  );
}
