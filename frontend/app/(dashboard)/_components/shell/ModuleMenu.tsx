"use client";

import { Popover } from "@base-ui/react/popover";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { type AppModule, isItemActive } from "@/lib/module-menu";
import { ITEM_ICONS, MODULE_ICONS } from "./menu-icons";

const RAIL_BUTTON =
  "flex h-11 items-center rounded-control transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Botão da rail, no mesmo estilo para o módulo com menu, o link direto (Painel, Pessoas), as configurações e o sair. Recolhida é só o ícone,
 * quadrado e centrado; expandida ocupa a largura e o ícone fica no mesmo lugar, com o nome ao lado.
 */
export function railButtonClass(isActive: boolean, isOpen = false, expanded = false) {
  return cn(
    RAIL_BUTTON,
    expanded ? "w-full gap-3 px-3" : "w-11 justify-center",
    isActive ? "bg-ink text-ink-foreground" : "text-ink-soft hover:bg-surface hover:text-ink",
    // Menu do módulo aberto: um fundo um tom acima do hover (nada de anel em volta).
    isOpen && !isActive && "bg-surface-muted text-ink"
  );
}

/** O nome do botão da rail expandida (recolhida o nome fica no `title`). */
export function RailLabel({ children }: { children: React.ReactNode }) {
  return <span className="truncate text-body font-medium">{children}</span>;
}

/**
 * Client Component: o cartão do módulo, ancorado ao ícone da rail. Os grupos (Cadastros, Relatórios…) ficam lado a lado; um item sem
 * tela (`href` ausente) aparece desativado com "Em breve". Fecha ao escolher um item, com Esc ou clicando fora.
 */
export function ModuleMenu({ appModule, isActive, expanded = false }: { appModule: AppModule; isActive: boolean; expanded?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const Icon = MODULE_ICONS[appModule.icon];

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        title={appModule.label}
        aria-label={appModule.label}
        className={railButtonClass(isActive, open, expanded)}
      >
        <Icon className="size-5 shrink-0" />
        {expanded && <RailLabel>{appModule.label}</RailLabel>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="right" align="start" sideOffset={14} className="z-50 outline-none">
          <Popover.Popup
            className={cn(
              "origin-(--transform-origin) rounded-card bg-surface p-4 text-ink shadow-float ring-1 ring-ink/10 outline-none transition duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
              appModule.groups.length > 1 ? "w-[min(47.5rem,92vw)]" : "w-[min(20rem,92vw)]"
            )}
          >
            <Popover.Title className="sr-only">{appModule.label}</Popover.Title>
            <div className="flex gap-4">
              {appModule.groups.map((group) => (
                <section key={group.title} className="min-w-0 flex-1">
                  <h3 className="mb-2 px-2.5 text-caption font-medium tracking-wide text-ink-faint uppercase">
                    {group.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const ItemIcon = ITEM_ICONS[item.icon];
                      const content = (
                        <>
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-panel",
                              item.href ? "bg-surface-muted text-brand" : "bg-surface-muted text-ink-faint"
                            )}
                          >
                            <ItemIcon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body font-medium">{item.label}</span>
                            <span className="block truncate text-caption text-ink-soft">{item.description}</span>
                          </span>
                          {!item.href && (
                            <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-caption text-ink-soft">
                              Em breve
                            </span>
                          )}
                        </>
                      );
                      return (
                        <li key={item.label}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              aria-current={isItemActive(item, group.items, pathname) ? "page" : undefined}
                              className={cn(
                                "flex items-center gap-3 rounded-panel px-2.5 py-2 transition-colors hover:bg-surface-muted aria-[current=page]:bg-surface-muted"
                              )}
                            >
                              {content}
                            </Link>
                          ) : (
                            <div
                              aria-disabled="true"
                              className="flex cursor-not-allowed items-center gap-3 rounded-panel px-2.5 py-2 opacity-60"
                            >
                              {content}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
