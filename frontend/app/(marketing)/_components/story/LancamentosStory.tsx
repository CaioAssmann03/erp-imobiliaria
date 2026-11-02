import { MODULE_PAGES } from "@/app/(marketing)/_components/content";
import { EntryChart } from "@/app/(marketing)/_components/visuals/EntryChart";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import obra from "@/public/marketing/lancamentos/obra.jpg";

import { IsoBars, ScanPhoto } from "@/app/(marketing)/_components/story/Orange3D";
import { StoryTitle } from "@/app/(marketing)/_components/story/StoryTitle";

const PAGE = MODULE_PAGES.lancamentos;

/**
 * O que acompanha cada parte (`index` da seção), no meio do texto, depois do parágrafo `after` (a contagem começa em 0), cada
 * elemento entrando de um jeito: uma foto de obra em tons de laranja, vista pela persiana de linhas, que abre como cortina;
 * colunas 3D feitas das mesmas linhas, que sobem do chão; e o gráfico de linhas do ano, que se desenha.
 */
const ELEMENTS: Record<number, { inline?: { after: number; node: React.ReactNode } }> = {
  // O que é um lançamento: uma foto larga de obra, no meio do texto, que se abre como uma cortina.
  0: { inline: { after: 0, node: <ScanPhoto src={obra} entrance="wipe" aspect="aspect-[21/9]" focus="50% 45%" className="my-12" /> } },
  // Como o valor é dado: uma coluna 3D por unidade, do tamanho do que cada uma paga, subindo do chão.
  1: { inline: { after: 1, node: <IsoBars className="my-6" /> } },
  // Uma vez, em parcelas ou todo mês: o gráfico de linhas do ano, o lançado em cada mês e a parte que se repete.
  2: { inline: { after: 0, node: <EntryChart className="my-12" /> } },
};

/**
 * A página de Lançamentos, no mesmo molde da de Condomínios (título enorme, frase de abertura, uma coluna de texto grande e
 * justificado com intertítulos), mas com os elementos de outro jeito: sem prints do sistema, no meio do texto, uma foto no
 * efeito laranja, colunas 3D feitas das linhas do site e um gráfico de linhas, cada um entrando de uma forma.
 */
export function LancamentosStory() {
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
