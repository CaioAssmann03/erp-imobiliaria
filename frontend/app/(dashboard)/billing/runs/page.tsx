import type { Metadata } from "next";

import { BillingRunsHome } from "./_components/BillingRunsHome";

export const metadata: Metadata = { title: "Execuções da emissão" };

export default function BillingRunsPage() {
  return <BillingRunsHome />;
}
