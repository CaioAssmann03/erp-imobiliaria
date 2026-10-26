"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

import { CONTACT_HREF } from "../content";
import { MarketingButton } from "../MarketingButton";
import { Reveal } from "../Reveal";
import { ScanlineSkyline } from "./ScanlineSkyline";

/**
 * Hero: título em serifa centralizado e o skyline laranja em linhas. Ao rolar, o título anda mais devagar que a
 * página e some; depois que os prédios saem de vista, a base deles escorre em pixels pela faixa abaixo do hero, até o
 * texto da seção seguinte.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Título: só transform e opacity, o compositor anima sem refazer layout.
  const titleY = useTransform(scrollYProgress, [0, 1], ["0svh", "38svh"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-svh flex-col items-center overflow-x-clip px-6 pt-36 md:pt-44">
      <motion.div
        style={still ? undefined : { y: titleY, opacity: titleOpacity }}
        className="relative z-10 will-change-transform"
      >
        <Reveal className="flex max-w-2xl flex-col items-center text-center">
          <h1 className="font-display text-hero">Administre condomínios com visibilidade total.</h1>
          <p className="mt-5 max-w-md text-body text-ink-soft">
            Um sistema moderno para administradoras: cadastros, cobrança, conciliação e financeiro de todos os
            condomínios, do cadastro ao extrato fechado.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <MarketingButton href={CONTACT_HREF}>Agendar demonstração</MarketingButton>
            <MarketingButton href="/how-it-works" variant="outline">
              Ver como funciona
            </MarketingButton>
          </div>
        </Reveal>
      </motion.div>

      <ScanlineSkyline
        className="absolute inset-x-0 bottom-0 h-[58svh] w-full"
        dripClassName="absolute inset-x-0 top-full h-[45svh] w-full"
      />
    </section>
  );
}
