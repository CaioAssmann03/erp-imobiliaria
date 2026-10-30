import type { Metadata } from "next";

import { GlobeSection } from "./_components/sections/GlobeSection";
import { Hero } from "./_components/hero/Hero";
import { ScanlineSkyline } from "./_components/hero/ScanlineSkyline";
import { Questions } from "./_components/sections/Questions";
import { ScreenStack } from "./_components/sections/ScreenStack";
import { Summary } from "./_components/sections/Summary";

export const metadata: Metadata = {
  title: "Software de gestão para administradoras de condomínios",
  description: "Cadastros, cobrança, conciliação bancária e financeiro de condomínios em um único sistema.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      {/* Fundo liso: esta parte sobe por cima do hero fixo e o cobre. */}
      <div className="relative z-10 bg-canvas">
        <Summary />
        <GlobeSection />
        <Questions />
        <ScreenStack />
        {/* Fecha o ciclo: os prédios voltam, em outra silhueta, assentados no topo do rodapé (-mb-12 anula o mt-12 dele). */}
        <ScanlineSkyline variant="footer" className="-mb-12 mt-12 h-44 w-full md:h-72" />
      </div>
    </>
  );
}
