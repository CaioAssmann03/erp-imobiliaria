import { redirect } from "next/navigation";

/** `/finance` abre a primeira seção. */
export default function FinancePage() {
  redirect("/finance/accounts-payable");
}
