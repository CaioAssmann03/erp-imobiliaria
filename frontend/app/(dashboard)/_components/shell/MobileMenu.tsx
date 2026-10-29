"use client";

import { ChevronDown, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeModule, APP_MODULES, isItemActive, type ModuleKey } from "@/lib/module-menu";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { ITEM_ICONS, MODULE_ICONS } from "./menu-icons";
import { SettingsDialog } from "./SettingsDialog";

/** Linha do menu do celular: 44 px de altura, o mínimo confortável para o dedo. */
const rowClass = (isActive: boolean) =>
  cn(
    "flex h-11 w-full items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
    isActive ? "bg-ink text-ink-foreground" : "text-ink-soft hover:bg-surface hover:text-ink"
  );

/**
 * Client Component: navegação do celular, um menu lateral aberto pelo botão da barra do topo. No alto a marca; depois os módulos, cada um
 * que tem telas recolhido numa linha (abre o do módulo em que se está, e abrir outro fecha o anterior), com só as telas que já existem
 * (as "Em breve" ficam só no menu do desktop). Embaixo, fixos, as configurações (o menu fecha e a janela abre sozinha) e o sair.
 * Fecha ao escolher uma tela. Só celular (no desktop a navegação é a `Rail`).
 */
export function MobileMenu() {
  const pathname = usePathname();
  const current = activeModule(pathname);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState<ModuleKey | null>(current);

  const close = () => setOpen(false);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Cada abertura começa no módulo da tela em que se está.
          if (next) setExpanded(current);
        }}
      >
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[min(20rem,88vw)] gap-0 p-0 sm:max-w-80">
          <SheetTitle className="sr-only">Navegação principal</SheetTitle>

          <Link href="/dashboard" onClick={close} className="flex h-14 w-fit shrink-0 items-center px-5">
            <Brand />
          </Link>

          <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 pb-3">
            {APP_MODULES.map((appModule) => {
              const ModuleIcon = MODULE_ICONS[appModule.icon];
              const isCurrent = current === appModule.key;

              if (appModule.groups.length === 0) {
                return (
                  <Link
                    key={appModule.key}
                    href={appModule.href ?? appModule.prefix}
                    onClick={close}
                    aria-current={isCurrent ? "page" : undefined}
                    className={rowClass(isCurrent)}
                  >
                    <ModuleIcon className="size-[1.125rem] shrink-0" />
                    {appModule.label}
                  </Link>
                );
              }

              // Só as telas que já existem; um grupo sem nenhuma some.
              const groups = appModule.groups
                .map((group) => ({ ...group, items: group.items.filter((item) => item.href) }))
                .filter((group) => group.items.length > 0);
              const isExpanded = expanded === appModule.key;

              return (
                <section key={appModule.key}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded(isExpanded ? null : appModule.key)}
                    className={cn(rowClass(false), isCurrent && "text-ink")}
                  >
                    <ModuleIcon className="size-[1.125rem] shrink-0" />
                    <span className="flex-1 text-left">{appModule.label}</span>
                    <ChevronDown className={cn("size-4 shrink-0 text-ink-faint transition-transform", isExpanded && "rotate-180")} />
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 mb-1 ml-5 border-l border-line pl-2">
                      {groups.map((group) => (
                        <div key={group.title}>
                          {groups.length > 1 && (
                            <h3 className="mt-2 mb-1 px-3 text-caption font-medium tracking-wide text-ink-faint uppercase">{group.title}</h3>
                          )}
                          {group.items.map((item) => {
                            const ItemIcon = ITEM_ICONS[item.icon];
                            const isActive = isItemActive(item, group.items, pathname);
                            return (
                              <Link
                                key={`${group.title}-${item.label}`}
                                href={item.href!}
                                onClick={close}
                                aria-current={isActive ? "page" : undefined}
                                className={rowClass(isActive)}
                              >
                                <ItemIcon className="size-4 shrink-0" />
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </nav>

          <div className="flex shrink-0 flex-col gap-1 border-t border-line px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => {
                close();
                setSettingsOpen(true);
              }}
              className={rowClass(false)}
            >
              <Settings className="size-[1.125rem] shrink-0" />
              Configurações
            </button>
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
