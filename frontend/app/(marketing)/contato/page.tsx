import type { Metadata } from "next";

import { pageMetadata } from "@/lib/site/page-metadata";

import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import { ContactCards } from "@/app/(marketing)/contato/ContactCards";

export const metadata: Metadata = pageMetadata({
  title: "Agendar demonstração",
  description: "Fale com a gente por WhatsApp ou mensagem e veja o METRI funcionando com os dados da sua administradora.",
  path: "/contato",
});

/** Contato e demonstração: um título e dois cards, o formulário de mensagem e o WhatsApp. */
export default function ContactPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-40 pb-28">
      <Reveal className="text-center">
        <h1 className="font-display text-hero">Agende uma demonstração</h1>
      </Reveal>
      <Reveal delay={0.1} className="mt-14 md:mt-20">
        <ContactCards />
      </Reveal>
    </section>
  );
}
