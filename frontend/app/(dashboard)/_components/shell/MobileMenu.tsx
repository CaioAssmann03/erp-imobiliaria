"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { activeModule, APP_MODULES, isItemActive } from "@/lib/module-menu";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { ITEM_ICONS, MODULE_ICONS } from "./menu-icons";
import { SettingsDialog } from "./SettingsDialog";

/**
 * Client Component: navegação do celular, um menu lateral aberto pelo botão da barra do topo.
 * Embaixo ficam a marca, as configurações (o menu fecha e a janela abre sozinha) e o sair. Fecha ao escolher um item. Só celular (no desktop a navegação é a `Rail`).
 */
export function MobileMenu() {
  const pathname = usePathname();
  const current = activeModule(pathname);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 gap-6 p-4 sm:max-w-64">
        <SheetTitle className="sr-only">Navegação principal</SheetTitle>
        <nav aria-label="Navegação principal" className="mt-8 flex min-h-0 flex-col gap-1 overflow-y-auto">
          {APP_MODULES.map((appModule) => {
            const ModuleIcon = MODULE_ICONS[appModule.icon];
            if (appModule.groups.length === 0) {
              const isActive = current === appModule.key;
              return (
                <Link
                  key={appModule.key}
                  href={appModule.href ?? appModule.prefix}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
                    isActive ? "bg-ink text-ink-foreground" : "text-ink-soft hover:bg-surface hover:text-ink"
                  )}
                >
                  <ModuleIcon className="size-[1.125rem] shrink-0" />
                  {appModule.label}
                </Link>
              );
            }
            return (
              <section key={appModule.key} className="mt-3 first:mt-0">
                <h3 className="mb-1 flex items-center gap-2 px-3 text-caption font-medium tracking-wide text-ink-faint uppercase">
                  <ModuleIcon className="size-3.5" />
                  {appModule.label}
                </h3>
                {appModule.groups.flatMap((group) =>
                  group.items.map((item) => {
                    const ItemIcon = ITEM_ICONS[item.icon];
                    const isActive = isItemActive(item, group.items, pathname);
                    if (!item.href) {
                      return (
                        <div
                          key={`${group.title}-${item.label}`}
                          aria-disabled="true"
                          className="flex h-9 items-center gap-3 rounded-control px-3 text-body text-ink-faint"
                        >
                          <ItemIcon className="size-4 shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          <span className="text-caption">Em breve</span>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={`${group.title}-${item.label}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex h-9 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
                          isActive ? "bg-ink text-ink-foreground" : "text-ink-soft hover:bg-surface hover:text-ink"
                        )}
                      >
                        <ItemIcon className="size-4 shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })
                )}
              </section>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 pt-4">
          <Link href="/" onClick={() => setOpen(false)} className="mb-2 flex w-fit px-1 py-1">
            <Brand />
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
            className="flex h-10 w-full items-center gap-3 rounded-control px-3 text-body font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink"
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
