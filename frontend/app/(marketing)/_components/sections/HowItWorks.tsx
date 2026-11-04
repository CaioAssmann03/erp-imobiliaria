"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { HOW_IT_WORKS, HOW_IT_WORKS_INTRO, type HowItWorksFloor } from "@/app/(marketing)/_components/content";
import { useLite } from "@/lib/theme/use-lite";

const EASE = [0.16, 1, 0.3, 1] as const;
/** O título em duas linhas, cada uma subindo de dentro de uma máscara. */
const TITLE_LINES = ["Simples de começar,", "automático de manter"] as const;
/** As listras laranja do site (as mesmas dos prédios da home): quatro linhas de 2 px com 1 px de vão. */
const STRIPES = "repeating-linear-gradient(to bottom, var(--color-brand) 0, var(--color-brand) 2px, transparent 2px, transparent 3px)";
const STRIPES_HEIGHT = 11;

/**
 * Onde cada prédio fica. De `lg` para cima, a posição e a largura são em `cqw` (a largura da cena), então a composição escala
 * inteira, como uma imagem; abaixo disso as faces são largas e empilhadas, com o topo em px (o texto precisa de altura fixa).
 * Cada um passa à frente do anterior; o último a entrar é o mais baixo e o mais para dentro da página.
 */
const BUILDINGS = [
  { x: "46cqw", y: "0cqw", mx: "15cqw", my: "0px" },
  { x: "14cqw", y: "46cqw", mx: "0cqw", my: "430px" },
  { x: "54cqw", y: "66cqw", mx: "15cqw", my: "860px" },
  { x: "28cqw", y: "98cqw", mx: "0cqw", my: "1290px" },
  { x: "54cqw", y: "130cqw", mx: "15cqw", my: "1720px" },
] as const;

/** Um prédio: sobe do chão (a base do `li`, que corta o que está abaixo) quando o `li` chega à tela. O `li` é quem é observado: o bloco que sobe começa escondido pelo corte. */
function Building({ spot, index, step, still }: { spot: (typeof BUILDINGS)[number]; index: number; step: HowItWorksFloor; still: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -25% 0px" }) || still;
  const delay = still || index > 2 ? 0 : index * 0.15;
  return (
    <li
      ref={ref}
      className="absolute bottom-0 left-(--mx) top-(--my) w-[calc(78cqw+var(--d))] overflow-hidden [--d:7cqw] lg:left-(--x) lg:top-(--y) lg:w-[calc(34cqw+var(--d))] lg:[--d:10cqw]"
      style={{ "--x": spot.x, "--y": spot.y, "--mx": spot.mx, "--my": spot.my } as React.CSSProperties}
    >
      <motion.div
        initial={false}
        animate={{ y: shown ? 0 : "100%" }}
        transition={{ duration: still ? 0 : 1.5, ease: EASE, delay }}
        className="absolute inset-0 will-change-transform"
      >
        <div className="absolute inset-y-0 left-0 w-[calc(100%-var(--d))] border-t-2 border-ink bg-canvas px-5 pt-5">
          <motion.div initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: still ? 0 : 0.7, delay: still ? 0 : 0.7 + delay }}>
            <h2 className="font-display text-title font-medium">
              {step.label}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
          </motion.div>
        </div>
        <div aria-hidden className="absolute inset-y-0 right-0 w-(--d) bg-band [clip-path:polygon(0_0,100%_var(--d),100%_100%,0_100%)]" />
      </motion.div>
    </li>
  );
}

/**
 * A página Como funciona: uma fila de prédios de faces da cor da tela e lados de tinta, cada um com uma etapa do cadastro ao
 * pagamento, em degraus que descem pela página. Abre com o título enorme, em linhas que sobem de uma máscara, uma faixa de quatro listras laranja que se desenha e, sob ela, uma frase de destaque e, abaixo dela, quatro parágrafos justificados em duas colunas; depois os prédios sobem do chão,
 * um a um, conforme a página desce, passando à frente do anterior. Segue o tema
 * e, no modo leve, aparece já no lugar.
 */
export function HowItWorks({ title }: { title: string }) {
  const still = useLite();

  return (
    <section aria-labelledby="how-it-works-title" className="mx-auto w-full max-w-6xl px-6 pt-32 md:pt-40 -mb-12">
      <header lang="pt-BR" className="pb-24 md:pb-32">
        <h1 id="how-it-works-title" aria-label={title} className="text-[clamp(2.25rem,12vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.05em] sm:text-[clamp(1.5rem,6.2vw,5rem)] sm:leading-[1.05]">
          {TITLE_LINES.map((line, index) => (
            <span key={line} aria-hidden className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="block"
                initial={still ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.1 + index * 0.14, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div
          aria-hidden
          initial={still ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.3, delay: 0.6, ease: EASE }}
          className="mt-12 origin-left md:mt-16"
          style={{ height: STRIPES_HEIGHT, backgroundImage: STRIPES }}
        />
        <motion.div
          initial={still ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: EASE }}
          className="mt-10 md:mt-14"
        >
          <p className="max-w-3xl text-xl leading-snug text-balance md:text-[1.75rem]">{HOW_IT_WORKS_INTRO.lead}</p>
          <div className="mt-10 lg:columns-2 lg:gap-20">
            {HOW_IT_WORKS_INTRO.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mb-6 break-inside-avoid text-left sm:text-justify text-lg leading-[1.7] text-ink-soft hyphens-manual sm:hyphens-auto">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>
      </header>

      <div className="[container-type:inline-size]">
        <div className="relative lg:h-[172cqw]">
          <ol className="relative h-[2140px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto">
            {BUILDINGS.map((spot, index) => (
              <Building key={HOW_IT_WORKS[index].label} spot={spot} index={index} step={HOW_IT_WORKS[index]} still={still} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
