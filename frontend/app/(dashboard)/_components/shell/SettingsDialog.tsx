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
  "flex h-9 w-full items-center rounded-control px-3 text-body font-medium whitespace-nowrap text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0";

/**
 * Client Component: botão de engrenagem (no menu lateral) que abre as configurações de
 * aparência no centro da tela: modo (claro/escuro/sistema), cor de destaque e fonte.
 */
export function SettingsDialog({
  initial,
  compact = false,
}: {
  initial: Appearance;
  /** Botão só com o ícone (barra do topo no celular). */
  compact?: boolean;
}) {
  const [appearance, setAppearance] = useState(initial);

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };

  const isDefault = JSON.stringify(appearance) === JSON.stringify(DEFAULT_APPEARANCE);

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        // Há mais de um botão (lateral e topo): ao abrir, lê o tema atual do <html>.
        if (open) setAppearance(readAppearance(initial));
      }}
    >
      <Dialog.Trigger
        title="Configurações"
        aria-label="Configurações"
        className={compact ? TRIGGER_COMPACT : TRIGGER_SIDEBAR}
      >
        {compact ? (
          <Settings className="size-5" />
        ) : (
          <>
            <Settings className="hidden size-[1.125rem] lg:group-data-[collapsed]/sidebar:block" />
            <span className="lg:group-data-[collapsed]/sidebar:hidden">Configurações</span>
          </>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(32rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card bg-surface p-5 sm:p-7 shadow-float outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <header className="mb-7">
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

          <footer className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => update(DEFAULT_APPEARANCE)}
              disabled={isDefault}
              className="text-body text-ink-soft transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Restaurar padrão
            </button>
            <Dialog.Close render={<Button type="button" size="lg" />}>Concluir</Dialog.Close>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
