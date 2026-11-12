"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";

import { useLite } from "@/lib/theme/use-lite";

import { CONTACT_HREF, MODULE_LINKS } from "../content";
import { MarketingButton } from "../MarketingButton";
import { HERO_DESCRIPTION, HERO_TITLE } from "./hero-copy";
import { ScanlineSkyline } from "./ScanlineSkyline";
import { SkyFlyers } from "./SkyFlyers";

const EASE = [0.22, 1, 0.36, 1] as const;
/** O título em duas linhas, uma sobre a outra, cada uma subindo de dentro de uma máscara (as palavras de `HERO_TITLE`). */
const TITLE_LINES = ["Condomínio", "em dia."] as const;

/**
 * Hero do celular (abaixo de `md`): em vez de um bloco centrado sobre o skyline, a tela é uma coluna. Em cima, alinhado à
 * esquerda, o texto: o título enorme em duas linhas (cada uma sobe de uma
 * máscara), a descrição, os dois botões e os módulos como links; embaixo, ocupando uma faixa própria (os prédios nunca passam
 * sobre o texto), o skyline laranja em linhas, mais alto que no desktop. Sem mouse, o toque acende as janelas em volta do dedo e
 * o parallax anda com a rolagem; de vez em quando passa um avião ou um bando de pássaros no céu sobre os prédios. Como no desktop,
 * o hero fica fixo no topo enquanto a seção seguinte sobe e o cobre, e o texto some aos poucos. Parado no modo leve. A faixa
 * do skyline encolhe em telas baixas e, nas muito baixas, os links dos módulos saem, para o texto nunca encostar nos prédios.
 */
export function HeroMobile() {
  const still = useLite();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  /** Entra por tempo (não pela rolagem): sobe e aparece, cada bloco um pouco depois do anterior. */
  const rise = (delay: number) => ({
    initial: still ? (false as const) : { y: 16, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.9, delay, ease: EASE },
  });

  return (
    <section className="sticky top-0 flex h-svh flex-col overflow-x-clip md:hidden">
      <motion.div style={still ? undefined : { opacity }} className="relative z-10 flex min-h-0 flex-1 flex-col justify-center px-5 pt-20 pb-6">

        <h1
          aria-label={HERO_TITLE}
          className="font-display text-[clamp(2.75rem,14.5vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.05em]"
        >
          {TITLE_LINES.map((line, index) => (
            <span key={line} aria-hidden className="block overflow-hidden pt-[0.1em] pb-[0.08em]">
              <motion.span
                className="block"
                initial={still ? false : { y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, delay: 0.25 + index * 0.14, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p {...rise(0.7)} className="mt-5 max-w-sm text-base leading-[1.55] text-ink-soft">
          {HERO_DESCRIPTION}
        </motion.p>

        <motion.div {...rise(0.85)} className="mt-7 flex flex-wrap gap-2">
          <MarketingButton href={CONTACT_HREF} className="h-11 flex-auto">
            Agendar demonstração
          </MarketingButton>
          <MarketingButton href="/features" variant="outline" className="h-11 flex-auto">
            Recursos
          </MarketingButton>
        </motion.div>

        <motion.nav
          {...rise(1)}
          aria-label="Módulos"
          className="mt-7 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/10 pt-4 [@media(max-height:700px)]:hidden"
        >
          {MODULE_LINKS.map((module) => (
            <Link key={module.href} href={module.href} className="text-label text-ink-soft transition-colors hover:text-ink">
              {module.label}
            </Link>
          ))}
        </motion.nav>
      </motion.div>

      {/* A faixa dos prédios: o céu dela é transparente e os pássaros e aviões passam por trás; o canvas fica por cima. */}
      <div aria-hidden className="pointer-events-none relative h-[clamp(10rem,36svh,20rem)] shrink-0">
        <motion.div style={still ? undefined : { opacity }} className="absolute inset-0">
          <SkyFlyers className="size-full" />
        </motion.div>
        <ScanlineSkyline className="absolute inset-0 size-full" />
      </div>
    </section>
  );
}
