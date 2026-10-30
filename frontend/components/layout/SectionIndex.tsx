"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

import { markerSpan, pageSmallness, readingLine, sectionPosition } from "@/lib/condominiums/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: o índice da direita de uma página com seções (condomínio, unidade). Um filete fino e, sobre ele, uma linha preta (o marcador)
 * que desliza com a rolagem: chega ao item de uma seção quando o topo dela alcança a linha de leitura e, daí até a seguinte, anda em proporção (ver
 * `sectionPosition`). Quando a página é pequena demais para rolar (um formulário curto, um lote com poucos lançamentos) o marcador não teria por onde
 * andar: então a linha cobre todos os itens, como se todos estivessem escolhidos, e vai encolhendo até um item só conforme a página ganha altura
 * (`pageSmallness`, `markerSpan`), sempre com transição. Clicar leva até a seção. Em telas largas é a coluna da direita; abaixo de `xl` (celular, tablet) vira uma fileira de
 * botões que rola de lado e fica presa sob o cabeçalho, com as mesmas seções e opções, e a atual sempre à vista.
 *
 * Pode ter, em blocos separados embaixo (ou sozinhos, sem `sections`), `links`: um grupo ou vários, cada um com o seu título, de opções que abrem outra tela no centro (o que não é da página em si),
 * sem marcador que desliza; a da tela aberta fica em destaque.
 */
interface LinkGroup {
  title: string;
  items: readonly { href: string; label: string; current?: boolean }[];
}

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
  links?: LinkGroup | readonly LinkGroup[];
}) {
  const [current, setCurrent] = useState(0);
  // Os itens que o marcador cobre agora (do primeiro ao último, sem incluir o fim): é o que fica em destaque no texto.
  const [covered, setCovered] = useState<[number, number]>([0, 1]);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLElement | null)[]>([]);
  const linkGroups: readonly LinkGroup[] = links === undefined ? [] : "title" in links ? [links] : links;
  const currentLink = linkGroups.flatMap((group) => group.items).findIndex((item) => item.current);
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

      // A altura (px) de um ponto do índice dado em "itens": 0 é o topo do primeiro, 1,5 o meio do segundo, e `count` o fim do último.
      const count = items.length;
      const last = items[count - 1];
      const bottom = (last?.offsetTop ?? 0) + (last?.offsetHeight ?? 0);
      const yOf = (item: number) => {
        const index = Math.min(Math.floor(item), count);
        if (index >= count) return bottom;
        const from = items[index]?.offsetTop ?? 0;
        const to = items[index + 1]?.offsetTop ?? bottom;
        return from + (item - index) * (to - from);
      };

      // Página que rola: a linha segue um item. Página pequena: cobre todos. Entre os dois, uma mistura (ver `markerSpan`).
      const span = markerSpan(position, pageSmallness(window.innerHeight, maxScroll), count);
      const top = yOf(span.start);
      marker.style.height = `${Math.max(yOf(span.end) - top, 0)}px`;
      marker.style.transform = `translateY(${top}px)`;
      marker.style.opacity = "1";
      const range: [number, number] = [Math.round(span.start), Math.round(span.end)];
      setCovered((previous) => (previous[0] === range[0] && previous[1] === range[1] ? previous : range));
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
        {linkGroups.map((group, groupIndex) => {
          const offset = sections.length + linkGroups.slice(0, groupIndex).reduce((total, previous) => total + previous.items.length, 0);
          return (
            <Fragment key={group.title}>
              {(sections.length > 0 || groupIndex > 0) && <span aria-hidden className="h-5 w-px shrink-0 bg-border" />}
              {group.items.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(element) => {
                    chipRefs.current[offset + index] = element;
                  }}
                  aria-current={item.current ? "page" : undefined}
                  className={chipClass(Boolean(item.current))}
                >
                  {item.label}
                </Link>
              ))}
            </Fragment>
          );
        })}
      </div>
    </nav>

    <nav aria-label={label} className="sticky top-[4.25rem] hidden w-48 shrink-0 xl:block 2xl:w-56">
      {sections.length > 0 && (
        <>
          <h2 className="mb-2 text-caption font-medium text-ink-faint">{title}</h2>
          <div className="relative">
            <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-border" />
            <span
              ref={markerRef}
              aria-hidden
              className="absolute top-0 -left-px w-0.5 rounded-full bg-ink opacity-0 transition-[transform,height] duration-200 ease-out"
            />
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
                    aria-current={index >= covered[0] && index < covered[1] ? "location" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      goTo(section.id);
                    }}
                    className={cn(
                      "block py-1.5 pl-4 text-body transition-colors hover:text-ink",
                      index >= covered[0] && index < covered[1] ? "font-medium text-ink" : "text-ink-soft"
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

      {linkGroups.map((group, groupIndex) => (
        <div key={group.title} className={cn((sections.length > 0 || groupIndex > 0) && "mt-6")}>
          <h2 className="mb-2 px-3 text-caption font-medium text-ink-faint">{group.title}</h2>
          <ul>
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item.current ? "page" : undefined}
                  className={cn(
                    "block rounded-control px-3 py-1.5 text-body transition-colors hover:text-ink",
                    item.current ? "bg-surface-muted font-medium text-ink" : "text-ink-soft"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
    </>
  );
}
