import type { Metadata } from "next";

import { ReportsOverview } from "./_components/ReportsOverview";

export const metadata: Metadata = { title: "Relatórios" };

/** `/reports`: a lista de relatórios vem da moldura (layout); aqui o panorama dos que existem, com o dado do dia. */
export default function ReportsPage() {
  return <ReportsOverview />;
}
