"use client";

import { CreditCard, Info, Percent, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

import { useActiveSection } from "./use-active-section";
import type { WorkspaceSectionId } from "./sections";

const ICONS: Record<WorkspaceSectionId, typeof Info> = {
  "dados-gerais": Info,
  "taxa-de-administracao": Percent,
  "dados-de-cobranca": CreditCard,
  configuracoes: Settings,
};

/**
 * O menu das seções: à direita (fixo ao rolar) a partir de 1280 px, e uma linha de botões acima do conteúdo
 * nas telas menores. Destaca a seção em vista e rola até a que for escolhida.
 */
export function SectionMenu({ sections }: { sections: readonly { id: WorkspaceSectionId; label: string }[] }) {
  const active = useActiveSection(sections.map((section) => section.id));

  const goTo = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav aria-label="Seções do condomínio" className="xl:sticky xl:top-4 xl:self-start">
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
        {sections.map((section) => {
          const Icon = ICONS[section.id];
          const isActive = active === section.id;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                onClick={(event) => goTo(event, section.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2.5 rounded-control px-3 text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                  isActive ? "bg-card font-medium text-ink shadow-card" : "text-ink-soft hover:bg-surface hover:text-ink",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
