import { GLOBE } from "./content";
import { GlobeStage } from "./globe/GlobeStage";
import { Reveal } from "./Reveal";
import { WordsReveal } from "./WordsReveal";

/**
 * Seção do mapa do Brasil: à esquerda o título grande em negrito (entra palavra por palavra) e a descrição curta; à
 * direita o mapa laranja em 3D, ampliado, com os cartões de condomínio nas partes vazias (um embaixo do texto, outro no
 * canto do mapa), para que nada cubra o texto e tudo caiba numa tela.
 */
export function GlobeSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-12 pb-20 md:pt-16">
      <GlobeStage>
        <h2 className="font-display text-hero font-bold text-balance">
          <WordsReveal text={GLOBE.title} />
        </h2>
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-lg text-[1.1875rem] leading-[1.6] text-ink-soft">{GLOBE.text}</p>
        </Reveal>
      </GlobeStage>
    </section>
  );
}
