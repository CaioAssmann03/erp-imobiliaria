import type { Metadata } from "next";

import { pageMetadata } from "@/lib/site/page-metadata";

import { MODULES } from "@/app/(marketing)/_components/content";
import { AcronymReveal } from "@/app/(marketing)/_components/sections/AcronymReveal";
import { ModuleSection } from "@/app/(marketing)/_components/sections/ModuleSection";
import { AssistantChat } from "@/app/(marketing)/_components/visuals/AssistantChat";
import { BillingFlow } from "@/app/(marketing)/_components/visuals/BillingFlow";
import { CondominiumPlan } from "@/app/(marketing)/_components/visuals/CondominiumPlan";

export const metadata: Metadata = pageMetadata({
  title: "Recursos",
  description: "Conheça os módulos do ERP para administradoras de condomínios.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <>
      <AcronymReveal />
      <div className="pb-32 md:pb-48">
        <ModuleSection {...MODULES.condominiums}>
          <CondominiumPlan />
        </ModuleSection>
        <ModuleSection {...MODULES.entries} placement="below" />
        <ModuleSection {...MODULES.billing} placement="right">
          <BillingFlow />
        </ModuleSection>
        <ModuleSection {...MODULES.assistant} placement="below">
          <AssistantChat className="max-w-2xl" />
        </ModuleSection>
      </div>
    </>
  );
}
