import type { Metadata } from "next";

import { PageIntro } from "@/app/(marketing)/_components/sections/PageIntro";
import { Steps } from "@/app/(marketing)/_components/sections/Steps";

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Veja o caminho do cadastro do condomínio até a conciliação dos pagamentos.",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Como funciona"
        title="Simples de começar, automático de manter"
        lead="Configure uma vez e deixe o sistema cuidar da rotina mensal."
      />
      <div className="px-6 py-16">
        <Steps />
      </div>
    </>
  );
}
