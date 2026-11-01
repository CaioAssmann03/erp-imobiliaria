import type { Metadata } from "next";
import { Suspense } from "react";

import { ListFallback } from "@/components/data-list";
import { PageHeader } from "@/components/layout/PageHeader";
import { RegistrySummary } from "@/app/(dashboard)/_components/home/bodies/RegistrySummary";

import { DashboardHome } from "../_components/home/DashboardHome";
import { Greeting } from "../_components/home/Greeting";
import { DashboardEditProvider } from "../_components/home/layout/DashboardEditProvider";
import { EditLayoutButton } from "../_components/home/layout/EditLayoutButton";

export const metadata: Metadata = { title: "Painel" };

export default function DashboardHomePage() {
  return (
    <DashboardEditProvider>
      <PageHeader
        title={<Greeting />}
        description={<RegistrySummary />}
        actions={<EditLayoutButton />}
      />
      <Suspense fallback={<ListFallback />}>
        <DashboardHome />
      </Suspense>
    </DashboardEditProvider>
  );
}
