"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { readingLine, sectionPosition } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: o índice da direita de uma página com seções (condomínio, unidade). Um filete fino e, sobre ele, um marcador que desliza
 * com a rolagem: chega ao item de uma seção quando o topo dela alcança a linha de leitura e, daí até a seguinte, anda em proporção (ver
 * `sectionPosition`). Clicar leva até a seção. Em telas largas é a coluna da direita; abaixo de `xl` (celular, tablet) vira uma fileira de
 * botões que rola de lado e fica presa sob o cabeçalho, com as mesmas seções e opções, e a atual sempre à vista.
 *
 * Pode ter, num bloco separado embaixo (ou sozinho, sem `sections`), `links`: opções que abrem outra tela no centro (o que não é da página em si),
 * sem marcador que desliza; a da tela aberta fica em destaque.
 */
export function SectionIndex({
  sections,
  label = "Seções",
  title = "Nesta página",
  links,
}: {
  sections: readonly { id: string; label: string }[];
  /** Nome acessível do `nav`. */
  label?: string;
  title?: string;
  links?: { title: string; items: readonly { href: string; label: string; current?: boolean }[] };
}) {
  const [current, setCurrent] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLElement | null)[]>([]);
  const currentLink = links?.items.findIndex((item) => item.current) ?? -1;
  // O botão da fileira que está em destaque: a seção à vista, ou, numa tela só de opções, a da tela aberta.
  const activeChip = sections.length > 0 ? current : currentLink >= 0 ? currentLink : -1;

  // Mantém o botão em destaque no meio da fileira (que rola de lado); oculta em `xl`, onde `offsetParent` é nulo.
  useEffect(() => {
    const bar = barRef.current;
    const chip = chipRefs.current[activeChip];
    if (!bar || !chip || bar.offsetParent === null) return;
    bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [activeChip]);

  useEffect(() => {
    if (sections.length === 0) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const items = itemRefs.current;
      const marker = markerRef.current;
      if (!marker || items.length === 0 || !items[0]) return;

      const tops = sections.map((section) => document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const line = readingLine(window.innerHeight, window.scrollY, maxScroll, tops[0] + window.scrollY);
      const position = sectionPosition(tops, line);

      // Do item de baixo para o de cima, em proporção: o marcador percorre a altura dos itens, não pula de um a outro.
      const index = Math.min(Math.floor(position), items.length - 1);
      const from = items[index]?.offsetTop ?? 0;
      const to = items[index + 1]?.offsetTop ?? from;
      const y = from + (position - index) * (to - from);
      marker.style.height = `${items[0].offsetHeight}px`;
      marker.style.transform = `translateY(${y}px)`;
      marker.style.opacity = "1";
      setCurrent(Math.round(position));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // As seções do formulário só existem depois que ele carrega, e o conteúdo muda de altura: refaz a conta quando a página muda.
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mutations.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [sections]);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  // No celular o cabeçalho (56 px) e a fileira (56 px) ficam presos no alto: a seção para no que sobra.
  const goToOnPhone = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const offset = (window.innerWidth >= 1024 ? 64 : 56) + 64;
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - offset, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };
  const chipClass = (active: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center rounded-full px-3.5 text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
      active ? "bg-ink font-medium text-ink-foreground" : "bg-surface text-ink-soft"
    );

  return (
    <>
    <nav aria-label={label} className="sticky top-14 z-20 order-first -mx-4 lg:top-16 lg:-mx-8 xl:hidden">
      <div
        ref={barRef}
        className="flex items-center gap-2 overflow-x-auto bg-shell/90 px-4 py-2.5 backdrop-blur-md lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            ref={(element) => {
              chipRefs.current[index] = element;
            }}
            onClick={() => goToOnPhone(section.id)}
            aria-current={index === current ? "location" : undefined}
            className={chipClass(index === current)}
          >
            {section.label}
          </button>
        ))}
        {sections.length > 0 && links && <span aria-hidden className="h-5 w-px shrink-0 bg-border" />}
        {links?.items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            ref={(element) => {
              chipRefs.current[sections.length + index] = element;
            }}
            aria-current={item.current ? "page" : undefined}
            className={chipClass(Boolean(item.current))}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>

    <nav aria-label={label} className="sticky top-20 hidden w-48 shrink-0 xl:block">
      {sections.length > 0 && (
        <>
          <h2 className="mb-3 text-caption font-medium tracking-wide text-ink-faint uppercase">{title}</h2>
          <div className="relative">
            <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border" />
            <span ref={markerRef} aria-hidden className="absolute top-0 -left-px w-0.5 rounded-full bg-ink opacity-0" />
            <ul>
              {sections.map((section, index) => (
                <li
                  key={section.id}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                >
                  <a
                    href={`#${section.id}`}
                    aria-current={index === current ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(section.id);
                    }}
                    className={cn(
                      "block py-1.5 pl-4 text-body transition-colors hover:text-ink",
                      index === current ? "font-medium text-ink" : "text-ink-soft"
                    )}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {links && (
        <div className={cn(sections.length > 0 && "mt-8")}>
          <h2 className="mb-3 text-caption font-medium tracking-wide text-ink-faint uppercase">{links.title}</h2>
          <ul>
            {links.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  className={cn(
                    "block py-1.5 pl-4 text-body transition-colors hover:text-ink",
                    item.current ? "font-medium text-ink" : "text-ink-soft"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
    </>
  );
}
