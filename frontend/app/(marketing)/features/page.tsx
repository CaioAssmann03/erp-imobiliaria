import type { Metadata } from "next";

import { FeatureGrid } from "@/app/(marketing)/_components/sections/FeatureGrid";
import { PageIntro } from "@/app/(marketing)/_components/sections/PageIntro";
import { Section } from "@/app/(marketing)/_components/layout/Section";

export const metadata: Metadata = {
  title: "Recursos",
  description: "Conheça os módulos do ERP para administradoras de condomínios.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Recursos"
        title="Um sistema, todos os módulos"
        lead="Cadastros, cobrança, financeiro e documentos conversam entre si, sem retrabalho."
      />
      <Section eyebrow="Módulos" title="O que você encontra dentro">
        <FeatureGrid />
      </Section>
    </>
  );
}
