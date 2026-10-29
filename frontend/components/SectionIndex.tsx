"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { readingLine, sectionPosition } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: o índice da direita de uma página com seções (condomínio, unidade). Um filete fino e, sobre ele, um marcador que desliza
 * com a rolagem: chega ao item de uma seção quando o topo dela alcança a linha de leitura e, daí até a seguinte, anda em proporção (ver
 * `sectionPosition`). Clicar leva até a seção. Só em telas largas: no celular a página rola sem índice.
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

  return (
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
  );
}
