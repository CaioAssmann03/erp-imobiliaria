import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/PageHeader";

import { DashboardHome } from "../_components/home/DashboardHome";
import { Greeting } from "../_components/home/Greeting";

export const metadata: Metadata = { title: "Painel" };

export default function DashboardHomePage() {
  return (
    <div>
      <PageHeader
        title={<Greeting />}
        description="O que pede atenção na administração de condomínios, locações, vendas e financeiro."
      />
      <Suspense fallback={<ListFallback />}>
        <DashboardHome />
      </Suspense>
    </div>
  );
}
