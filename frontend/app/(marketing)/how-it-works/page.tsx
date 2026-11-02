import type { Metadata } from "next";

import { pageMetadata } from "@/lib/site/page-metadata";
import { HowItWorks } from "@/app/(marketing)/_components/sections/HowItWorks";

export const metadata: Metadata = pageMetadata({
  title: "Como funciona",
  description: "Veja o caminho do cadastro do condomínio até a conciliação dos pagamentos.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return <HowItWorks title="Simples de começar, automático de manter" />;
}
