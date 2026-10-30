import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

import { DashboardHome } from "../_components/home/DashboardHome";
import { Greeting } from "../_components/home/Greeting";
import { RegistrySummary } from "../_components/home/RegistrySummary";

export const metadata: Metadata = { title: "Painel" };

export default function DashboardHomePage() {
  return (
    <div>
      <PageHeader
        title={<Greeting />}
        description={<RegistrySummary />}
      />
      <Suspense fallback={<ListFallback />}>
        <DashboardHome />
      </Suspense>
    </div>
  );
}
