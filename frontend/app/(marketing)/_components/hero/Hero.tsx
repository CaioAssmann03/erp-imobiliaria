"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { CONTACT_HREF } from "../content";
import { MarketingButton } from "../MarketingButton";
import { ScanlineSkyline } from "./ScanlineSkyline";
import { SkyFlyers } from "./SkyFlyers";

const TITLE = "Condomínio em ordem.";
const DESCRIPTION =
  "Emita a cobrança do mês em lote, receba as baixas em tempo real e feche o extrato sem digitar nada, para todos os condomínios da administradora, no mesmo painel.";

/**
 * Hero: uma frase só como título, grande, em negrito e numa linha (a mesma fonte do site), subindo de dentro de uma
 * máscara; embaixo, uma descrição curta e o botão de agendar. O nome do negócio fica no cabeçalho. Fica no centro do hero, sobre o skyline
 * laranja em linhas (o canvas é transparente e fica por cima, então qualquer prédio que o alcance passa na frente). O
 * hero fica fixo no topo enquanto a seção seguinte (com fundo liso) sobe por cima e o cobre, como uma cortina; o texto
 * some aos poucos nesse trecho. A frase precisa caber numa linha em qualquer largura (até uns 21 caracteres).
 */
export function Hero() {
  const still = useReducedMotion();
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 350], [1, 0]);

  return (
    <section className="sticky top-0 h-svh overflow-x-clip">
      <motion.div style={still ? undefined : { opacity }} className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <h1 className="text-center font-display leading-[0.95] tracking-[-0.045em] whitespace-nowrap">
          <span className="block overflow-hidden px-[0.04em] pt-[0.1em] pb-[0.08em]">
            <motion.span
              className="block text-[clamp(1.75rem,8.6vw,6.25rem)] font-bold"
              initial={still ? false : { y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {TITLE}
            </motion.span>
          </span>
        </h1>
        <motion.p
          initial={still ? false : { y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-md text-balance text-center text-body text-ink-soft"
        >
          {DESCRIPTION}
        </motion.p>
        <motion.div
          initial={still ? false : { y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <MarketingButton href={CONTACT_HREF}>Agendar demonstração</MarketingButton>
        </motion.div>
      </motion.div>

      {/* De vez em quando passa um avião ou um bando de pássaros no céu, acima do título. */}
      <motion.div style={still ? undefined : { opacity }} aria-hidden className="pointer-events-none absolute inset-x-0 top-16 h-[28svh]">
        <SkyFlyers className="size-full" />
      </motion.div>

      {/* Por cima do nome: o canvas é transparente, então só os prédios o encobrem. */}
      <ScanlineSkyline className="absolute inset-x-0 bottom-0 z-10 h-[40svh] w-full md:h-[58svh]" />
    </section>
  );
}
