"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand/Brand";
import { activeModule, APP_MODULES } from "@/lib/navigation/module-menu";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { MODULE_ICONS } from "./menu-icons";
import { ModuleMenu, railButtonClass, RailLabel } from "./ModuleMenu";
import { SearchRailButton } from "./SearchRailButton";
import { SettingsDialog } from "./SettingsDialog";
import { useRailExpanded } from "./use-rail-expanded";

/**
 * Client Component: a lateral (só em telas grandes; no celular a navegação é o `MobileMenu`). Recolhida é uma faixa de ícones; expandida, os
 * ícones com o nome ao lado. Clicar no logo alterna os dois, e a escolha fica lembrada neste navegador. Um módulo com grupos abre o cartão
 * `ModuleMenu`; sem grupos (Painel, Pessoas) é um link direto. Embaixo ficam a busca (`SearchRailButton`), as configurações e o sair. Precisa do pathname para marcar o módulo ativo.
 */
export function Rail() {
  const current = activeModule(usePathname());
  const [expanded, toggle] = useRailExpanded();
  // A largura só anima depois de um clique: quem abre a página já com a rail expandida não a vê "abrir" a cada carga.
  const [animated, setAnimated] = useState(false);

  return (
    <aside
      className={cn(
        // z-[60]: acima do fundo dos modais (z-40 e z-50), que não escurece o menu lateral.
        "sticky top-0 z-[60] hidden h-screen shrink-0 flex-col gap-1.5 overflow-hidden bg-canvas px-3.5 py-4 lg:flex",
        expanded ? "w-60" : "w-[4.5rem]",
        animated && "transition-[width] duration-200 ease-out",
      )}
    >
      <button
        type="button"
        onClick={() => {
          setAnimated(true);
          toggle();
        }}
        aria-label={expanded ? "Recolher menu" : "Expandir menu"}
        aria-expanded={expanded}
        title={expanded ? "Recolher menu" : "Expandir menu"}
        className="mb-8 flex h-11 items-center rounded-control px-2 outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Brand compact={!expanded} />
      </button>

      <nav aria-label="Módulos" className="flex flex-col gap-1.5">
        {APP_MODULES.map((appModule) => {
          const isActive = current === appModule.key;
          if (appModule.groups.length > 0) {
            return <ModuleMenu key={appModule.key} appModule={appModule} isActive={isActive} expanded={expanded} />;
          }
          const Icon = MODULE_ICONS[appModule.icon];
          return (
            <Link
              key={appModule.key}
              href={appModule.href ?? appModule.prefix}
              title={appModule.label}
              aria-label={appModule.label}
              aria-current={isActive ? "page" : undefined}
              className={railButtonClass(isActive, false, expanded)}
            >
              <Icon className="size-5 shrink-0" />
              {expanded && <RailLabel>{appModule.label}</RailLabel>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        <SearchRailButton expanded={expanded} />
        <SettingsDialog expanded={expanded} />
        <LogoutButton rail expanded={expanded} />
      </div>
    </aside>
  );
}
