"use client";

import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./LogoutButton";
import { isNavItemActive, NAV_ITEMS } from "./nav-items";
import { SettingsDialog } from "./SettingsDialog";

/**
 * Client Component: navegação do celular, um menu lateral aberto pelo botão da barra do topo.
 * Embaixo ficam a marca, as configurações (o menu fecha e a janela abre sozinha) e o sair. Fecha ao escolher um item. Só celular (no desktop a navegação é a `Sidebar`).
 */
export function MobileMenu() {
  const pathname = usePathname();
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
        <nav aria-label="Navegação principal" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={isNavItemActive(item.href, pathname) ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-control px-3 text-body font-medium transition-colors",
                isNavItemActive(item.href, pathname)
                  ? "bg-ink text-ink-foreground"
                  : "text-ink-soft hover:bg-surface hover:text-ink"
              )}
            >
              <item.icon className="size-[1.125rem] shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
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
