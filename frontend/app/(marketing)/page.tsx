import type { Metadata } from "next";

import { ContactCta } from "./_components/ContactCta";
import { Hero } from "./_components/hero/Hero";
import { ModuleIndex } from "./_components/ModuleIndex";
import { ProductTour } from "./_components/product-tour/ProductTour";
import { Section } from "./_components/Section";
import { Statement } from "./_components/Statement";

export const metadata: Metadata = {
  title: "Software de gestão para administradoras de condomínios",
  description: "Cadastros, cobrança, conciliação bancária e financeiro de condomínios em um único sistema.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Statement />
      <ProductTour />
      <Section eyebrow="O que o sistema faz" title="Um sistema para toda a rotina da administradora">
        <ModuleIndex />
      </Section>
      <ContactCta />
    </>
  );
}
