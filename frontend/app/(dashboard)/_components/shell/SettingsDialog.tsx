"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Accessibility, MessageCircle, Palette, PanelLeft, RotateCcw, Settings, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_APPEARANCE, type Appearance } from "@/lib/theme/appearance";
import { cn } from "@/lib/utils";
import { centeredModalBackdropClass } from "@/lib/theme/ui";

import { railButtonClass, RailLabel } from "./menu/ModuleMenu";
import { AccentSection } from "./settings/AccentSection";
import { AccessibilitySection } from "./settings/AccessibilitySection";
import { AssistantSection } from "./settings/AssistantSection";
import { applyAppearance, readAppearance } from "@/lib/theme/apply-appearance";
import { FontSection } from "./settings/FontSection";
import { SettingsGroup } from "./settings/SettingsSection";
import { ModeSection } from "./settings/ModeSection";
import { NavigationSection } from "./settings/NavigationSection";

const TRIGGER_COMPACT =
  "flex size-10 items-center justify-center rounded-button text-ink-soft transition-colors hover:bg-surface hover:text-ink";

const TABS = [
  { id: "appearance", label: "Aparência", icon: Palette, description: "Como o sistema se parece. As escolhas ficam salvas neste navegador." },
  { id: "accessibility", label: "Acessibilidade", icon: Accessibility, description: "Texto maior e menos movimento, para ler e usar com mais conforto." },
  { id: "navigation", label: "Navegação", icon: PanelLeft, description: "O menu lateral e os atalhos de teclado." },
  { id: "assistant", label: "Assistente", icon: MessageCircle, description: "A ajuda por perguntas no canto da tela." },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * As configurações do sistema, salvas neste navegador. Uma janela com abas (à esquerda no computador, em linha no celular): **Aparência**
 * (modo, cor de destaque, fonte), **Acessibilidade** (tamanho do texto, animações) e **Navegação** (menu lateral e atalhos de teclado)
 * e **Assistente** (liga ou desliga o botão de ajuda). "Restaurar padrão" volta só a aparência e a acessibilidade; o menu lateral e o assistente têm o próprio interruptor.
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
        <Dialog.Backdrop className={cn("z-40", centeredModalBackdropClass)} />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-card bg-surface shadow-float outline-none transition duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:h-[min(38rem,90vh)] sm:max-h-none sm:w-[min(54rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:flex-row sm:rounded-card sm:data-[ending-style]:translate-y-[-50%] sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-[-50%] sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0">
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink-faint/40 sm:hidden" />

          <nav className="flex shrink-0 flex-col gap-3 px-5 pt-4 pb-3 sm:w-60 sm:gap-7 sm:bg-surface-muted sm:px-4 sm:py-8">
            <Dialog.Title className="text-heading sm:px-3">Configurações</Dialog.Title>
            <div role="tablist" aria-label="Seções" aria-orientation="vertical" className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-1.5 sm:overflow-visible">
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
                      "flex h-10 shrink-0 items-center gap-2.5 rounded-control px-3 text-left text-body whitespace-nowrap outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 sm:w-full",
                      selected ? "bg-surface font-medium text-ink shadow-card" : "text-ink-soft hover:bg-surface/60 hover:text-ink"
                    )}
                  >
                    <item.icon aria-hidden className={cn("size-4 shrink-0", selected ? "text-ink" : "text-ink-faint")} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between gap-4 px-5 pt-3 pb-4 sm:px-10 sm:pt-9 sm:pb-6">
              <div>
                <h2 className="text-title">{activeTab.label}</h2>
                <Dialog.Description className="mt-1.5 max-w-md text-body leading-relaxed text-ink-soft">{activeTab.description}</Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Fechar"
                className="-mt-1 -mr-2 hidden size-9 shrink-0 items-center justify-center rounded-button text-ink-soft outline-none transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60 sm:flex"
              >
                <X className="size-5" />
              </Dialog.Close>
            </header>

            <div
              role="tabpanel"
              id="settings-panel"
              aria-labelledby={`settings-tab-${tab}`}
              className="min-h-0 flex-1 space-y-8 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-10"
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
              {tab === "assistant" && <AssistantSection />}
            </div>

            <footer className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-10 sm:pt-4 sm:pb-7">
              <button
                type="button"
                onClick={() => update(DEFAULT_APPEARANCE)}
                disabled={isDefault}
                className="-ml-3 flex h-9 items-center gap-2 rounded-button px-3 text-body text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-40"
              >
                <RotateCcw aria-hidden className="size-3.5" />
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
