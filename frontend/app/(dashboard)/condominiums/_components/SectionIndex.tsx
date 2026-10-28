"use client";

import { useEffect, useState } from "react";

import { REGISTRY_SECTIONS } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: o índice da direita da página do condomínio. Marca a seção que está à vista (IntersectionObserver nos blocos
 * `id=<seção>`) e leva até a escolhida. Só em telas largas: no celular a página rola sem índice.
 */
export function SectionIndex() {
  const [current, setCurrent] = useState<string>(REGISTRY_SECTIONS[0].id);

  useEffect(() => {
    const visible = new Set<string>();
    const observed = new Map<string, Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // A última seção (na ordem da página) que toca a faixa de leitura é a atual: a seguinte já começou nela.
        const last = REGISTRY_SECTIONS.findLast((section) => visible.has(section.id));
        if (last) setCurrent(last.id);
      },
      { rootMargin: "-80px 0px -55% 0px" }
    );
    // As seções do formulário só existem depois que ele carrega: observa de novo o que mudou na página.
    const sync = () => {
      for (const section of REGISTRY_SECTIONS) {
        const element = document.getElementById(section.id);
        const previous = observed.get(section.id);
        if (element === previous) continue;
        if (previous) observer.unobserve(previous);
        visible.delete(section.id);
        if (element) {
          observer.observe(element);
          observed.set(section.id, element);
        } else observed.delete(section.id);
      }
    };
    sync();
    const mutations = new MutationObserver(sync);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label="Seções do condomínio" className="sticky top-20 hidden w-48 shrink-0 xl:block">
      <h2 className="mb-2 px-3 text-caption font-medium tracking-wide text-ink-faint uppercase">Neste condomínio</h2>
      <ul>
        {REGISTRY_SECTIONS.map((section) => {
          const isCurrent = section.id === current;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isCurrent ? "location" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(section.id);
                }}
                className={cn(
                  "block rounded-r-panel px-3 py-2 text-body shadow-[inset_2px_0_0_var(--color-surface-sunken)] transition-colors hover:text-ink",
                  isCurrent
                    ? "font-medium text-ink shadow-[inset_2px_0_0_var(--color-brand)]"
                    : "text-ink-soft"
                )}
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
