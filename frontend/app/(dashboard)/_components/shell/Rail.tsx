"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/Brand";
import { activeModule, APP_MODULES } from "@/lib/module-menu";
import { LogoutButton } from "./LogoutButton";
import { MODULE_ICONS } from "./menu-icons";
import { ModuleMenu, railButtonClass } from "./ModuleMenu";
import { SettingsDialog } from "./SettingsDialog";

/**
 * Client Component: a faixa de ícones da lateral (só em telas grandes; no celular a navegação é o `MobileMenu`). Um módulo com grupos abre o
 * cartão `ModuleMenu`; sem grupos (Painel, Pessoas) é um link direto. Embaixo ficam as configurações e o sair. Precisa do pathname para marcar o módulo ativo.
 */
export function Rail() {
  const current = activeModule(usePathname());

  return (
    <aside className="sticky top-0 hidden h-screen w-[4.5rem] shrink-0 flex-col items-center gap-1.5 bg-canvas py-4 lg:flex">
      <Link href="/dashboard" aria-label="ERP Imobiliária" title="ERP Imobiliária" className="mb-4">
        <Brand compact />
      </Link>

      <nav aria-label="Módulos" className="flex flex-col items-center gap-1.5">
        {APP_MODULES.map((appModule) => {
          const isActive = current === appModule.key;
          if (appModule.groups.length > 0) {
            return <ModuleMenu key={appModule.key} appModule={appModule} isActive={isActive} />;
          }
          const Icon = MODULE_ICONS[appModule.icon];
          return (
            <Link
              key={appModule.key}
              href={appModule.href ?? appModule.prefix}
              title={appModule.label}
              aria-label={appModule.label}
              aria-current={isActive ? "page" : undefined}
              className={railButtonClass(isActive)}
            >
              <Icon className="size-5" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1.5">
        <SettingsDialog />
        <LogoutButton rail />
      </div>
    </aside>
  );
}
