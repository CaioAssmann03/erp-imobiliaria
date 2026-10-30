import { redirect } from "next/navigation";

import { statementUrl } from "@/lib/statement-workspace";

/** O extrato de um condomínio abre em /finance/statement/[id]. */
export default async function CondominiumStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(statementUrl(id));
}
