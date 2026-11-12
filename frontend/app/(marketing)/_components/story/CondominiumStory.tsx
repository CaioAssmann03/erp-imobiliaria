import condominio from "@/public/marketing/condominio.png";
import condominioDark from "@/public/marketing/condominio-dark.png";
import unidades from "@/public/marketing/unidades.png";
import unidadesDark from "@/public/marketing/unidades-dark.png";

import { MODULE_PAGES } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import { ScreenCollage } from "@/app/(marketing)/_components/story/ScreenCollage";
import { StoryPhoto } from "@/app/(marketing)/_components/story/StoryPhoto";
import { StoryTitle } from "@/app/(marketing)/_components/story/StoryTitle";

const PAGE = MODULE_PAGES.condominios;

/** As telas do exemplo do fim da página: as unidades, ao fundo, e o condomínio aberto, à frente. */
const SCREEN_PAIR = [
  { image: unidades, dark: unidadesDark, alt: "Unidade aberta: lista de unidades do condomínio, dados da unidade e frações ideais" },
  { image: condominio, dark: condominioDark, alt: "Condomínio aberto: a lista de condomínios, a identificação, o endereço e o mapa" },
] as const;

/** Em que parte do texto cada foto aparece (`index` da seção) e como: poucas, alternando de lado e de tamanho. */
const PHOTOS_BY_SECTION: Record<number, React.ComponentProps<typeof StoryPhoto>> = {
  0: { photo: 3, side: "right", shape: "portrait", drift: 60 },
  2: { photo: 1, side: "left", shape: "square", drift: 80, focus: "40% 50%" },
  3: { photo: 0, side: "right", shape: "tall", drift: 90, focus: "30% 50%" },
  4: { photo: 4, side: "left", shape: "portrait", drift: 70, focus: "42% 50%" },
};

/**
 * A página de Condomínios, de rolagem comum e lida como um texto só: o título enorme, a frase de abertura e, numa única
 * coluna no meio, o texto corrido, justificado e em corpo grande, com intertítulos discretos e sem divisões entre as
 * partes. Poucas fotos ilustrativas aparecem nas margens, de vez em quando (`StoryPhoto`), e no fim um exemplo rápido do sistema: duas telas reais sobrepostas, só imagens, que se ampliam num clique (`ScreenCollage`).
 */
export function CondominiumStory() {
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
          const photo = PHOTOS_BY_SECTION[index];
          return (
            <section key={section.title} className="relative flow-root pb-16 md:pb-20">
              <div className="mx-auto max-w-2xl">
                <h2 className="mb-6 font-display text-title font-medium text-ink">{section.title}</h2>
                {photo && <StoryPhoto {...photo} className="xl:top-1/2 xl:-translate-y-1/2" />}
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mb-7 text-left sm:text-justify text-lg leading-[1.75] text-ink-soft hyphens-manual sm:hyphens-auto last:mb-0 md:text-[1.3rem] md:leading-[1.7]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </article>

      <section aria-label="O sistema por dentro" className="mx-auto w-full max-w-5xl px-6 pt-16 md:pt-24">
        <ScreenCollage screens={SCREEN_PAIR} />
      </section>
    </>
  );
}
