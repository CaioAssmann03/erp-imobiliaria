"use client";

import { motion, useInView } from "motion/react";
import { useId, useRef } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { MarketingButton } from "@/app/(marketing)/_components/MarketingButton";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ModuleSectionProps {
  title: string;
  paragraphs: readonly string[];
  /** O módulo tem uma página própria (`/features/[slug]`): a seção termina com o botão "Saber mais" para ela. */
  slug?: string;
  /** Onde fica o desenho: à esquerda (o padrão), à direita ou embaixo do texto, na largura toda, com o texto em duas colunas (no celular fica sempre acima ou abaixo do texto). */
  placement?: "left" | "right" | "below";
  /** O desenho do módulo. Sem ele, a seção é só o título e o texto. */
  children?: React.ReactNode;
}

/**
 * Uma parte do sistema em Recursos: o nome, um texto curto, justificado e hifenizado como o `Summary` (só que menor), e o
 * desenho do módulo, ao lado do texto ou embaixo dele (embaixo, o texto ocupa a largura toda, em duas colunas). Uma linha fina se desenha no topo e, em seguida, o título e os
 * parágrafos sobem um a um quando a seção chega à tela. Estático para quem prefere menos movimento.
 */
export function ModuleSection({ title, paragraphs, slug, placement = "left", children }: ModuleSectionProps) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const still = useLite();
  const on = still || shown;
  const below = placement === "below";

  const rise = (index: number) => ({
    initial: false as const,
    animate: { opacity: on ? 1 : 0, y: on ? 0 : 18 },
    transition: { duration: 0.8, delay: still ? 0 : 0.4 + index * 0.16, ease: EASE },
  });

  const heading = (
    <motion.h2 {...rise(0)} id={id} className="font-display text-section">
      {title}
    </motion.h2>
  );
  const text = paragraphs.map((paragraph, index) => (
    <motion.p
      key={paragraph}
      {...rise(index + 1)}
      className="mb-4 text-justify text-base leading-[1.7] text-ink-soft hyphens-auto last:mb-0"
    >
      {paragraph}
    </motion.p>
  ));

  const more = slug && (
    <motion.div {...rise(paragraphs.length + 1)} className="mt-8">
      <MarketingButton href={`/features/${slug}`} variant="outline" aria-label={`Saber mais sobre ${title}`}>
        Saber mais
      </MarketingButton>
    </motion.div>
  );

  return (
    <section ref={ref} lang="pt-BR" aria-labelledby={id} className="mx-auto w-full max-w-6xl px-6 pt-32 md:pt-48">
      <div className="relative pt-10 md:pt-12">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/15" />
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: on ? 1 : 0 }}
          transition={{ duration: 1.1, ease: EASE }}
          className="absolute inset-x-0 top-0 h-px origin-left bg-ink"
        />

        {below ? (
          <>
            {heading}
            <div className="mt-6 lg:columns-2 lg:gap-20 [&>p]:break-inside-avoid">{text}</div>
            {more}
            {children && <div className="mt-12 md:mt-16">{children}</div>}
          </>
        ) : (
          <div className={cn("grid items-start gap-12 lg:gap-20", placement === "right" ? "lg:grid-cols-[6fr_5fr]" : "lg:grid-cols-[5fr_6fr]")}>
            <div className={cn(placement === "right" && "lg:order-2")}>{children}</div>
            <div className={cn(placement === "right" && "lg:order-1")}>
              {heading}
              <div className="mt-6">{text}</div>
              {more}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
