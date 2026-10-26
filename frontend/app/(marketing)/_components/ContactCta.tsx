import { CONTACT_HREF } from "./content";
import { MarketingButton } from "./MarketingButton";
import { Reveal } from "./Reveal";

/** Fechamento: faixa preta de ponta a ponta, chamada em serifa à esquerda e as ações à direita. */
export function ContactCta() {
  return (
    <section id="contato" className="mt-12 scroll-mt-16 bg-ink text-ink-foreground">
      <Reveal className="mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-label text-brand">Contato</p>
          <h2 className="mt-3 max-w-2xl font-display text-section">
            Conheça o sistema com os dados da sua administradora.
          </h2>
          <p className="mt-4 max-w-xl text-body text-ink-foreground/65">
            Agende uma demonstração: mostramos o cadastro, a emissão do mês e a conciliação usando a rotina da sua
            equipe.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <MarketingButton href={CONTACT_HREF} variant="inverse">
            Agendar demonstração
          </MarketingButton>
          <MarketingButton href="/login" variant="inverse-outline">
            Entrar no sistema
          </MarketingButton>
        </div>
      </Reveal>
    </section>
  );
}
