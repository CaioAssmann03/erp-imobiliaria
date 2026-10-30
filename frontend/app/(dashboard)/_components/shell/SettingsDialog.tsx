"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Settings, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_APPEARANCE, type Appearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { modalBackdropClass } from "@/lib/ui";

import { railButtonClass, RailLabel } from "./ModuleMenu";
import { AccentSection } from "./settings/AccentSection";
import { AccessibilitySection } from "./settings/AccessibilitySection";
import { applyAppearance, readAppearance } from "./settings/apply-appearance";
import { FontSection } from "./settings/FontSection";
import { SettingsGroup } from "./settings/SettingsSection";
import { ModeSection } from "./settings/ModeSection";
import { NavigationSection } from "./settings/NavigationSection";

const TRIGGER_COMPACT =
  "flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink";

const TABS = [
  { id: "appearance", label: "Aparência", description: "Como o sistema se parece, salvo neste navegador." },
  { id: "accessibility", label: "Acessibilidade", description: "Texto maior e menos movimento." },
  { id: "navigation", label: "Navegação", description: "O menu lateral e os atalhos de teclado." },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * As configurações do sistema, salvas neste navegador. Uma janela com abas (à esquerda no computador, em linha no celular): **Aparência**
 * (modo, cor de destaque, fonte), **Acessibilidade** (tamanho do texto, animações) e **Navegação** (menu lateral e atalhos de teclado).
 * "Restaurar padrão" volta só a aparência e a acessibilidade; o menu lateral tem o próprio interruptor.
 */
export function SettingsDialog({
  compact = false,
  expanded = false,
  open,
  onOpenChange,
}: {
  /** Botão redondo da barra do topo no celular (sem isto, é o botão da rail). */
  compact?: boolean;
  /** Na rail expandida, o botão mostra o nome ao lado do ícone. */
  expanded?: boolean;
  /** Controlado por quem usa (sem estes dois, o próprio botão abre e fecha). Controlado, não desenha o botão. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [tab, setTab] = useState<TabId>("appearance");

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];
  const isDefault = JSON.stringify(appearance) === JSON.stringify(DEFAULT_APPEARANCE);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // Pode haver mais de um botão (lateral e celular): ao abrir, lê o tema atual do <html>.
        if (nextOpen) {
          setAppearance(readAppearance(DEFAULT_APPEARANCE));
          setTab("appearance");
        }
        onOpenChange?.(nextOpen);
      }}
    >
      {open === undefined && (
        <Dialog.Trigger
          title="Configurações"
          aria-label="Configurações"
          className={compact ? TRIGGER_COMPACT : railButtonClass(false, false, expanded)}
        >
          <Settings className="size-5 shrink-0" />
          {!compact && expanded && <RailLabel>Configurações</RailLabel>}
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Backdrop className={cn("z-40", modalBackdropClass)} />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-card bg-surface shadow-float outline-none transition duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:h-[min(34rem,90vh)] sm:max-h-none sm:w-[min(46rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:flex-row sm:rounded-card sm:data-[ending-style]:translate-y-[-50%] sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-[-50%] sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0">
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink-faint/40 sm:hidden" />

          <nav className="flex shrink-0 flex-col gap-3 px-5 pt-4 pb-3 sm:w-52 sm:gap-6 sm:border-r sm:border-border sm:bg-surface-muted/50 sm:px-4 sm:py-7">
            <Dialog.Title className="text-heading sm:px-3">Configurações</Dialog.Title>
            <div role="tablist" aria-label="Seções" aria-orientation="vertical" className="flex gap-1 overflow-x-auto sm:flex-col sm:overflow-visible">
              {TABS.map((item) => {
                const selected = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`settings-tab-${item.id}`}
                    aria-selected={selected}
                    aria-controls="settings-panel"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "h-9 shrink-0 rounded-control px-3 text-left text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 sm:w-full",
                      selected ? "bg-ink/[0.07] font-medium text-ink" : "text-ink-soft hover:text-ink"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-2 pb-2 sm:px-8 sm:pt-7 sm:pb-3">
              <div>
                <h2 className="text-title">{activeTab.label}</h2>
                <Dialog.Description className="mt-1 text-body text-ink-soft">{activeTab.description}</Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Fechar"
                className="-mt-1 -mr-2 hidden size-9 shrink-0 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60 sm:flex"
              >
                <X className="size-5" />
              </Dialog.Close>
            </header>

            <div
              role="tabpanel"
              id="settings-panel"
              aria-labelledby={`settings-tab-${tab}`}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8"
            >
              {tab === "appearance" && (
                <SettingsGroup>
                  <ModeSection appearance={appearance} onChange={update} />
                  <AccentSection appearance={appearance} onChange={update} />
                  <FontSection appearance={appearance} onChange={update} />
                </SettingsGroup>
              )}
              {tab === "accessibility" && <AccessibilitySection appearance={appearance} onChange={update} />}
              {tab === "navigation" && <NavigationSection />}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pt-4 sm:pb-6">
              <button
                type="button"
                onClick={() => update(DEFAULT_APPEARANCE)}
                disabled={isDefault}
                className="h-9 text-body text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              >
                Restaurar padrão
              </button>
              <Dialog.Close render={<Button type="button" size="lg" className="sm:hidden" />}>Concluir</Dialog.Close>
            </footer>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
