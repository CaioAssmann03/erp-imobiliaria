"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEFAULT_APPEARANCE, type Appearance } from "@/lib/appearance";

import { AccentSection } from "./settings/AccentSection";
import { applyAppearance, readAppearance } from "./settings/apply-appearance";
import { FontSection } from "./settings/FontSection";
import { ModeSection } from "./settings/ModeSection";

const TRIGGER_COMPACT =
  "flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink";
const TRIGGER_SIDEBAR =
  "flex h-9 w-full items-center gap-3 rounded-control px-3 text-body font-medium whitespace-nowrap text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:sidebar-closed:justify-center lg:sidebar-closed:px-0";

export function SettingsDialog({
  compact = false,
  open,
  onOpenChange,
}: {
  /** Botão só com o ícone (barra do topo no celular). */
  compact?: boolean;
  /** Controlado por quem usa (sem estes dois, o próprio botão abre e fecha). Controlado, não desenha o botão. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };

  const isDefault = JSON.stringify(appearance) === JSON.stringify(DEFAULT_APPEARANCE);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        // Pode haver mais de um botão (lateral e celular): ao abrir, lê o tema atual do <html>.
        if (nextOpen) setAppearance(readAppearance(DEFAULT_APPEARANCE));
        onOpenChange?.(nextOpen);
      }}
    >
      {open === undefined && (
        <Dialog.Trigger
          title="Configurações"
          aria-label="Configurações"
          className={compact ? TRIGGER_COMPACT : TRIGGER_SIDEBAR}
        >
          {compact ? (
            <Settings className="size-5" />
          ) : (
            <>
              <Settings className="size-[1.125rem] shrink-0" />
              <span className="lg:sidebar-closed:hidden">Configurações</span>
            </>
          )}
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-card bg-surface shadow-float outline-none transition duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90vh] sm:w-[min(32rem,94vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card sm:data-[ending-style]:translate-y-[-50%] sm:data-[ending-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-[-50%] sm:data-[starting-style]:scale-95 sm:data-[starting-style]:opacity-0">
          <div aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink-faint/40 sm:hidden" />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-2 sm:p-7 sm:pb-2">
            <header className="mb-6 sm:mb-7">
              <Dialog.Title className="text-title">Configurações</Dialog.Title>
              <Dialog.Description className="mt-1 text-body text-ink-soft">
                Aparência do sistema. Fica salva neste navegador.
              </Dialog.Description>
            </header>

            <div className="space-y-7">
              <ModeSection appearance={appearance} onChange={update} />
              <AccentSection appearance={appearance} onChange={update} />
              <FontSection appearance={appearance} onChange={update} />
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:border-0 sm:px-7 sm:pt-4 sm:pb-7">
            <button
              type="button"
              onClick={() => update(DEFAULT_APPEARANCE)}
              disabled={isDefault}
              className="h-11 text-body text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40 sm:h-auto"
            >
              Restaurar padrão
            </button>
            <Dialog.Close render={<Button type="button" size="lg" className="flex-1 sm:flex-none" />}>
              Concluir
            </Dialog.Close>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
