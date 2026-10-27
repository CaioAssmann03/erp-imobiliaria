import { redirect } from "next/navigation";

/** `/billing` abre a primeira seção. */
export default function BillingPage() {
  redirect("/billing/entries");
}
