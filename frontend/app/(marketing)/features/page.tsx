import type { Metadata } from "next";

import { ContactCta } from "../_components/ContactCta";
import { FeatureGrid } from "../_components/FeatureGrid";
import { PageIntro } from "../_components/PageIntro";
import { Section } from "../_components/Section";

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
      <ContactCta />
    </>
  );
}
