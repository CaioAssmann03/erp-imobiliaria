import dinheiro from "@/public/marketing/cobrancas/dinheiro.jpg";

import { MODULE_PAGES } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import { RealBoleto, ScanBand } from "@/app/(marketing)/_components/story/CobrancasVisuals";
import { ScanPhoto } from "@/app/(marketing)/_components/story/Orange3D";
import { StoryTitle } from "@/app/(marketing)/_components/story/StoryTitle";

const PAGE = MODULE_PAGES.cobrancas;

/**
 * O que acompanha cada parte (`index` da seção), no meio do texto, depois do parágrafo `after` (a contagem começa em 0). Poucos
 * elementos, cada um de um tipo: uma faixa fina nas linhas laranja, a imagem de um boleto de verdade e uma foto de
 * dinheiro em tons de laranja que se abre do centro.
 */
const ELEMENTS: Record<number, { inline?: { after: number; node: React.ReactNode } }> = {
  // Emitir o mês: só o texto e uma faixa fina nas linhas laranja, discreta.
  1: { inline: { after: 0, node: <ScanBand className="mb-9" /> } },
  // O documento de cada unidade: um boleto de verdade, só de exemplo.
  2: { inline: { after: 0, node: <RealBoleto className="my-12" /> } },
  // Pagamento e atraso: dinheiro, numa foto que se abre do centro e se aproxima.
  4: { inline: { after: 0, node: <ScanPhoto src={dinheiro} entrance="zoom" aspect="aspect-[21/9]" focus="50% 45%" className="my-12" /> } },
};

/**
 * A página de Cobranças, no mesmo molde das de Condomínios e Lançamentos (título enorme, frase de abertura, uma coluna de
 * texto grande e justificado com intertítulos), com poucos elementos e de outro tipo: uma faixa fina nas linhas laranja, a
 * imagem de um boleto de verdade e uma foto de dinheiro no efeito laranja.
 */
export function CobrancasStory() {
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-6 pt-36 pb-24 text-center md:pt-44 md:pb-32">
        <StoryTitle>{PAGE.title}</StoryTitle>
        <Reveal delay={0.9}>
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-snug text-ink md:mt-10 md:text-[1.75rem]">{PAGE.lead}</p>
        </Reveal>
      </header>

      <article lang="pt-BR" className="w-full px-6">
        {PAGE.sections.map((section, index) => {
          const { inline } = ELEMENTS[index] ?? {};
          return (
            <section key={section.title} className="relative flow-root pb-16 last:pb-0 md:pb-20">
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-6 font-display text-title font-medium text-ink">{section.title}</h2>
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <div key={paragraph}>
                    <p className="mb-7 text-justify text-lg leading-[1.75] text-ink-soft hyphens-auto md:text-[1.3rem] md:leading-[1.7]">{paragraph}</p>
                    {inline?.after === paragraphIndex && inline.node}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </article>
    </>
  );
}
