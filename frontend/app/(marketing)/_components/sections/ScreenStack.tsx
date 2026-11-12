"use client";

import { useState } from "react";

import { SCREENS } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";
import { ThemedImage } from "@/app/(marketing)/_components/ThemedImage";
import { cn } from "@/lib/utils";
import cobrancas from "@/public/marketing/cobrancas.png";
import cobrancasDark from "@/public/marketing/cobrancas-dark.png";
import lancamentos from "@/public/marketing/lancamentos.png";
import lancamentosDark from "@/public/marketing/lancamentos-dark.png";
import unidades from "@/public/marketing/unidades.png";
import unidadesDark from "@/public/marketing/unidades-dark.png";

const IMAGES = [
  { light: unidades, dark: unidadesDark },
  { light: lancamentos, dark: lancamentosDark },
  { light: cobrancas, dark: cobrancasDark },
];

/**
 * As três telas reais do sistema numa linha só: a que está sob o mouse (ou com o foco, ou tocada) se abre e mostra a tela inteira; as
 * outras viram tiras estreitas com o título de pé. A tela não se reescala ao abrir: ela tem sempre a altura da linha e a tira só a
 * recorta, então o que muda é a largura (`flex-grow`, só CSS). Quinas retas e só um fio de contorno, sem sombra. O título e a frase da
 * tela aberta ficam embaixo e trocam com ela. Sem voltar ao início ao tirar o mouse, para não tremer. Abaixo de `lg` não cabe uma linha:
 * as telas vêm uma sob a outra, cada uma com o seu texto; no celular cada uma tem 44 rem de largura numa janela que se arrasta na horizontal (do contrário o texto da tela ficaria ilegível), a partir de `sm` ela cabe inteira.
 */
export function ScreenStack() {
  const [active, setActive] = useState(0);

  return (
    <section aria-label="Telas do sistema" className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
      <Reveal className="hidden lg:block">
        {/* 1104 = a coluna (max-w-6xl menos o respiro); 540 = a altura em que a tela aberta (8 de 10 partes, menos os vãos) tem a proporção 1440/900 da print. */}
        <div className="flex aspect-[1104/540] gap-3">
          {SCREENS.map((screen, index) => {
            const open = index === active;
            return (
              <button
                key={screen.key}
                type="button"
                aria-pressed={open}
                aria-label={screen.title}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={cn(
                  "relative min-w-0 overflow-hidden rounded-sharp bg-surface text-left ring-1 ring-ink/10 outline-none transition-[flex-grow] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-brand",
                  open ? "grow-[8] cursor-default" : "grow cursor-pointer",
                )}
                style={{ flexBasis: 0 }}
              >
                {/* Altura da linha, largura da tela inteira: a tira só recorta, nada se reescala durante a troca. */}
                <span className="absolute inset-y-0 left-0 block aspect-[1440/900]">
                  <ThemedImage
                    light={IMAGES[index].light}
                    dark={IMAGES[index].dark}
                    alt={screen.alt}
                    sizes="900px"
                    className="block h-full w-full max-w-none"
                  />
                </span>
                <span
                  aria-hidden
                  className={cn("absolute inset-0 flex items-end justify-center bg-canvas/70 pb-6 transition-opacity duration-500", open ? "opacity-0" : "opacity-100")}
                >
                  <span className="font-display text-title font-normal text-ink [writing-mode:vertical-rl] rotate-180">{screen.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid">
          {SCREENS.map((screen, index) => (
            <div
              key={screen.key}
              aria-hidden={index !== active}
              className={cn("col-start-1 row-start-1 transition-opacity duration-500", index === active ? "opacity-100" : "pointer-events-none opacity-0")}
            >
              <h3 className="font-display text-title font-normal text-ink">{screen.title}</h3>
              <p className="mt-2 max-w-xl text-body text-ink-soft">{screen.lead}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Abaixo de `lg`: uma tela por vez, em tamanho legível. A tela fica numa janela que se arrasta para os lados (só na horizontal: o gesto vertical continua rolando a página). */}
      <div className="space-y-12 lg:hidden">
        {SCREENS.map((screen, index) => (
          <Reveal key={screen.key}>
            <article>
            <div
              tabIndex={0}
              aria-label={`${screen.title}: arraste para os lados para ver a tela inteira`}
              className="-mx-5 snap-x snap-proximity overflow-x-auto overscroll-x-contain px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <div className="relative aspect-[1440/900] w-[44rem] max-w-none overflow-hidden rounded-sharp bg-surface ring-1 ring-ink/10 sm:w-full">
                <ThemedImage light={IMAGES[index].light} dark={IMAGES[index].dark} alt={screen.alt} sizes="704px" className="block h-full w-full" />
              </div>
            </div>
            <p aria-hidden className="mt-1 text-label text-ink-faint sm:hidden">
              Arraste para ver a tela inteira
            </p>
            <h3 className="mt-4 font-display text-title font-normal text-ink">{screen.title}</h3>
            <p className="mt-2 text-body text-ink-soft">{screen.lead}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
