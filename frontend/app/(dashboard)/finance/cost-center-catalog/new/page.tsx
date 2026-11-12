import type { Metadata } from "next";

import { PhoneBackLink } from "@/components/layout/BackLink";
import { catalogUrl } from "@/lib/finance/cost-center-catalog-workspace";

import { CatalogItemForm } from "../_components/CatalogItemForm";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default function NewCatalogItemPage() {
  return (
    <>
      <div className="mb-6">
        <PhoneBackLink href={catalogUrl()} label="Sub-contas" />
        <h1 className="text-title">Nova sub-conta</h1>
      </div>
      <CatalogItemForm />
    </>
  );
}
