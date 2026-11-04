import { MODULE_PAGES } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import { StoryTitle } from "@/app/(marketing)/_components/story/StoryTitle";
import { AssistantMascotAlone } from "@/app/(marketing)/_components/visuals/AssistantMascotAlone";
import { NeuralNet, QuestionFilter, VoiceWave } from "@/app/(marketing)/_components/visuals/AssistenteVisuals";

const PAGE = MODULE_PAGES.assistente;

/**
 * O que acompanha cada seção (`index`), no meio do texto, depois do parágrafo `after` (a contagem começa em 0): desenhos no efeito
 * de linhas laranja do site que ilustram a inteligência artificial: uma rede de camadas com o sinal passando, o filtro de dados pessoais do chat
 * recusando um CPF e a onda de uma resposta se formando.
 */
const DECORATIONS: Record<number, readonly { after: number; node: React.ReactNode }[]> = {
  0: [{ after: 0, node: <NeuralNet /> }],
  2: [{ after: 0, node: <QuestionFilter /> }],
  3: [{ after: 0, node: <VoiceWave /> }],
};

/**
 * A página do Assistente, no mesmo molde das outras (título enorme, frase de abertura, uma coluna de texto grande e justificado
 * com intertítulos), com o próprio Assistente logo depois da abertura (o personagem com o balão, que não abre conversa e faz os olhos reagirem ao
 * clique) e, no meio do texto, desenhos de inteligência artificial no efeito de linhas laranja (`DECORATIONS`).
 */
export function AssistenteStory() {
  return (
    <>
      <header className="mx-auto w-full max-w-6xl px-6 pt-36 pb-16 text-center md:pt-44 md:pb-20">
        <StoryTitle>{PAGE.title}</StoryTitle>
        <Reveal delay={0.9}>
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-snug text-ink md:mt-10 md:text-[1.75rem]">{PAGE.lead}</p>
        </Reveal>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 pb-20 md:pb-28">
        <AssistantMascotAlone />
      </div>

      <article lang="pt-BR" className="w-full px-6">
        {PAGE.sections.map((section, index) => (
          <section key={section.title} className="relative flow-root pb-16 last:pb-0 md:pb-20">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-6 font-display text-title font-medium text-ink">{section.title}</h2>
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <div key={paragraph}>
                  <p className="mb-7 text-justify text-lg leading-[1.75] text-ink-soft hyphens-auto md:text-[1.3rem] md:leading-[1.7]">{paragraph}</p>
                  {DECORATIONS[index]?.filter((item) => item.after === paragraphIndex).map((item, itemIndex) => (
                    <div key={itemIndex}>{item.node}</div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </article>
    </>
  );
}
