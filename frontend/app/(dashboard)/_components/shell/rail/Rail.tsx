"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/brand/Brand";
import { activeModule, APP_MODULES } from "@/lib/navigation/module-menu";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/app/(dashboard)/_components/shell/menu/LogoutButton";
import { MODULE_ICONS } from "@/app/(dashboard)/_components/shell/menu/menu-icons";
import { ModuleMenu, railButtonClass, RailLabel } from "@/app/(dashboard)/_components/shell/menu/ModuleMenu";
import { SearchRailButton } from "@/app/(dashboard)/_components/shell/search/SearchRailButton";
import { SettingsDialog } from "@/app/(dashboard)/_components/shell/SettingsDialog";
import { useRailExpanded } from "./use-rail-expanded";

/**
 * Client Component: a lateral (só em telas grandes; no celular a navegação é o `MobileMenu`). Recolhida é uma faixa de ícones; expandida, os
 * ícones com o nome ao lado. O botão "Recolher menu" / "Expandir menu" (com ícone e, expandida, o texto) alterna os dois, e a escolha fica lembrada
 * neste navegador; clicar no logo faz o mesmo, só para quem usa o mouse. Um módulo com grupos abre o cartão `ModuleMenu`; sem grupos (Painel, Pessoas) é um
 * link direto. Embaixo ficam a busca (`SearchRailButton`), as configurações, o botão de recolher e o sair. Precisa do pathname para marcar o módulo ativo.
 */
export function Rail() {
  const current = activeModule(usePathname());
  const [expanded, toggle] = useRailExpanded();
  // A largura só anima depois de um clique: quem abre a página já com a rail expandida não a vê "abrir" a cada carga.
  const [animated, setAnimated] = useState(false);
  const toggleLabel = expanded ? "Recolher menu" : "Expandir menu";
  const toggleRail = () => {
    setAnimated(true);
    toggle();
  };

  return (
    <aside
      className={cn(
        // z-[60]: acima do fundo dos modais (z-40 e z-50), que não escurece o menu lateral.
        // overflow-y-auto: com o texto ampliado e a janela baixa os botões de baixo (busca, configurações, sair) não cabem; rolam em vez de serem cortados.
        "sticky top-0 z-[60] hidden h-screen shrink-0 flex-col gap-1.5 overflow-x-hidden overflow-y-auto overscroll-contain bg-canvas px-3.5 py-4 [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden",
        expanded ? "w-60" : "w-[4.5rem]",
        animated && "transition-[width] duration-200 ease-out",
      )}
    >
      {/* O logo também alterna a rail, um atalho para o mouse: quem usa teclado ou leitor de tela tem o botão "Recolher menu" lá embaixo. */}
      <button
        type="button"
        onClick={toggleRail}
        title={toggleLabel}
        tabIndex={-1}
        aria-hidden="true"
        className="mb-8 flex h-11 items-center rounded-control px-2 outline-none transition-opacity hover:opacity-75"
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
        <button
          type="button"
          onClick={toggleRail}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={expanded}
          className={railButtonClass(false, false, expanded)}
        >
          {expanded ? <PanelLeftClose className="size-5 shrink-0" /> : <PanelLeftOpen className="size-5 shrink-0" />}
          {expanded && <RailLabel>Recolher menu</RailLabel>}
        </button>
        <LogoutButton rail expanded={expanded} />
      </div>
    </aside>
  );
}
