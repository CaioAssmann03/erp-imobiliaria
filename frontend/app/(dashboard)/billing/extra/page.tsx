import type { Metadata } from "next";

import { ExtraBillingHome } from "./_components/ExtraBillingHome";

export const metadata: Metadata = { title: "Boleto extra" };

export default function ExtraBillingPage() {
  return <ExtraBillingHome />;
}
