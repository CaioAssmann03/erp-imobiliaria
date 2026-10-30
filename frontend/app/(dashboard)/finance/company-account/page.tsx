import type { Metadata } from "next";

import { CompanyBalance } from "./_components/CompanyBalance";

export const metadata: Metadata = { title: "Conta da imobiliária" };

export default function CompanyAccountPage() {
  return <CompanyBalance />;
}
