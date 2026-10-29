"use client";

import { useEffect, useState } from "react";

import { currentSection } from "@/lib/condominium-registry";
import { cn } from "@/lib/utils";

/**
 * Client Component: o índice da direita de uma página com seções (condomínio, unidade). Marca a seção que está à vista
 * (IntersectionObserver nos blocos `id=<seção>`) e leva até a escolhida. Só em telas largas: no celular a página rola sem índice.
 */
export function SectionIndex({
  sections,
  label = "Seções",
  title = "Nesta página",
}: {
  sections: readonly { id: string; label: string }[];
  /** Nome acessível do `nav`. */
  label?: string;
  title?: string;
}) {
  const [current, setCurrent] = useState<string>(sections[0].id);

  useEffect(() => {
    const visible = new Set<string>();
    const observed = new Map<string, Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const next = currentSection(visible, sections);
        if (next) setCurrent(next);
      },
      { rootMargin: "-80px 0px -55% 0px" }
    );
    // As seções do formulário só existem depois que ele carrega: observa de novo o que mudou na página.
    const sync = () => {
      for (const section of sections) {
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
  }, [sections]);

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav aria-label={label} className="sticky top-20 hidden w-48 shrink-0 xl:block">
      <h2 className="mb-2 px-3 text-caption font-medium tracking-wide text-ink-faint uppercase">{title}</h2>
      <ul>
        {sections.map((section) => {
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
