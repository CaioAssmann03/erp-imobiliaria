import type { Metadata } from "next";

import { pageMetadata } from "@/lib/site/page-metadata";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site/site";

import { JsonLd } from "./_components/JsonLd";
import { MarketingButton } from "./_components/MarketingButton";
import { Reveal } from "./_components/motion/Reveal";
import { GlobeSection } from "./_components/sections/GlobeSection";
import { Hero } from "./_components/hero/Hero";
import { ScanlineSkyline } from "./_components/hero/ScanlineSkyline";
import { Questions } from "./_components/sections/Questions";
import { ScreenStack } from "./_components/sections/ScreenStack";
import { Summary } from "./_components/sections/Summary";

export const metadata: Metadata = pageMetadata({
  title: "Software de gestão para administradoras de condomínios",
  description: "Cadastros, cobrança, conciliação bancária e financeiro de condomínios em um único sistema.",
  path: "/",
});

// Só o que o site afirma: sem preço, avaliação ou endereço inventados.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, url: absoluteUrl("/"), logo: absoluteUrl("/icon/large") },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
      url: absoluteUrl("/"),
      inLanguage: "pt-BR",
      publisher: { "@id": absoluteUrl("/#organization") },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={STRUCTURED_DATA} />
      <Hero />
      {/* Fundo liso: esta parte sobe por cima do hero fixo e o cobre. */}
      <div className="relative z-10 bg-canvas">
        <Summary />
        <GlobeSection />
        <Questions />
        <ScreenStack />
        {/* O convite para ver cada parte do sistema, antes de o ciclo se fechar. */}
        <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 pt-4 pb-24 text-center md:pb-32">
          <p className="font-display text-title font-normal">Cada parte do sistema, com calma.</p>
          <MarketingButton href="/features">Conhecer os recursos</MarketingButton>
        </Reveal>
        {/* Fecha o ciclo: os prédios voltam, em outra silhueta, assentados no topo do rodapé (-mb-12 anula o mt-12 dele). */}
        <ScanlineSkyline variant="footer" className="-mb-12 mt-12 h-44 w-full md:h-72" />
      </div>
    </>
  );
}
