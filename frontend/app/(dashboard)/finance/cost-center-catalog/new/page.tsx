import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { catalogUrl } from "@/lib/cost-center-catalog-workspace";

import { CatalogItemForm } from "../_components/CatalogItemForm";

export const metadata: Metadata = { title: "Nova sub-conta" };

export default function NewCatalogItemPage() {
  return (
    <>
      <div className="mb-6">
        <div className="lg:hidden">
          <BackLink href={catalogUrl()} label="Sub-contas" />
        </div>
        <h1 className="text-title">Nova sub-conta</h1>
      </div>
      <CatalogItemForm />
    </>
  );
}
