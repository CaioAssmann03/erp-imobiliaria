"use client";

import { Popover } from "@base-ui/react/popover";
import { Info } from "lucide-react";

/**
 * A dica de um campo atrás de um ícone de ajuda ao lado do rótulo: abre ao passar o mouse, ao tocar ou com
 * Enter, e não ocupa linha nenhuma do formulário. O texto também fica (invisível) ligado ao campo por
 * `aria-describedby`, então o leitor de tela o lê sem precisar abrir nada.
 */
export function FieldHint({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={120}
        aria-label={`Ajuda: ${label}`}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors outline-none hover:text-ink focus-visible:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <Info aria-hidden className="size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6} className="z-50">
          <Popover.Popup className="max-w-64 rounded-panel bg-surface px-3 py-2 text-caption leading-4 text-ink shadow-float outline-none">
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
