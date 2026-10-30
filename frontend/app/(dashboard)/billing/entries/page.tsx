import type { Metadata } from "next";

import { BillingEntriesMonth } from "./_components/BillingEntriesMonth";

export const metadata: Metadata = { title: "Inclusão de valores" };

export default function BillingEntriesPage() {
  return <BillingEntriesMonth />;
}
