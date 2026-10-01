"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Settings } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ACCENTS,
  APPEARANCE_COOKIES,
  DEFAULT_APPEARANCE,
  FONTS,
  MODES,
  type Appearance,
  type Mode,
} from "@/lib/appearance";
import { cn } from "@/lib/utils";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Aplica no <html> (efeito imediato) e grava em cookie (o servidor renderiza já com o tema). */
function applyAppearance(next: Appearance) {
  const root = document.documentElement;
  root.dataset.mode = next.mode;
  root.dataset.accent = next.accent;
  root.dataset.font = next.font;
  for (const key of ["mode", "accent", "font"] as const) {
    document.cookie = `${APPEARANCE_COOKIES[key]}=${next[key]}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  }
}

/** Seção com título à esquerda e o valor atual à direita. */
function Section({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-body font-medium">{title}</h3>
        {value && <span className="text-caption text-ink-soft">{value}</span>}
      </div>
      {children}
    </section>
  );
}

/** Miniatura do app nas cores de cada modo (cores fixas: representam o modo, não o tema atual). */
const PREVIEWS: Record<Mode, { bg: string; card: string; line: string }> = {
  light: { bg: "#e9e9e8", card: "#ffffff", line: "#d9d9d6" },
  dark: { bg: "#101010", card: "#21211f", line: "#3a3a36" },
  system: { bg: "", card: "", line: "" },
};

function ModePreview({ mode }: { mode: Mode }) {
  const half = (key: "light" | "dark") => (
    <div className="flex h-full flex-1 flex-col gap-1 p-1.5" style={{ background: PREVIEWS[key].bg }}>
      <div className="h-1.5 w-6 rounded-full" style={{ background: PREVIEWS[key].line }} />
      <div className="flex flex-1 flex-col justify-end gap-1 rounded-md p-1.5" style={{ background: PREVIEWS[key].card }}>
        <div className="h-1 w-8 rounded-full" style={{ background: PREVIEWS[key].line }} />
        <div className="h-1 w-5 rounded-full" style={{ background: PREVIEWS[key].line }} />
      </div>
    </div>
  );

  return (
    <div className="flex h-16 w-full overflow-hidden rounded-panel">
      {mode === "system" ? (
        <>
          {half("light")}
          {half("dark")}
        </>
      ) : (
        half(mode)
      )}
    </div>
  );
}

/**
 * Client Component: botão de engrenagem (no menu lateral) que abre as configurações de
 * aparência no centro da tela: modo (claro/escuro/sistema), cor de destaque e fonte.
 */
export function SettingsDialog({ initial }: { initial: Appearance }) {
  const [appearance, setAppearance] = useState(initial);

  const update = (patch: Partial<Appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);
    applyAppearance(next);
  };

  const isDefault = JSON.stringify(appearance) === JSON.stringify(DEFAULT_APPEARANCE);
  const selectedRing = "ring-2 ring-brand";

  return (
    <Dialog.Root>
      <Dialog.Trigger
        title="Configurações"
        aria-label="Configurações"
        className="flex h-9 w-full items-center rounded-control px-3 text-body font-medium whitespace-nowrap text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
      >
        <Settings className="hidden size-[1.125rem] lg:group-data-[collapsed]/sidebar:block" />
        <span className="lg:group-data-[collapsed]/sidebar:hidden">Configurações</span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(32rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card bg-surface p-7 shadow-float outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <header className="mb-7">
            <Dialog.Title className="text-title">Configurações</Dialog.Title>
            <Dialog.Description className="mt-1 text-body text-ink-soft">
              Aparência do sistema. Fica salva neste navegador.
            </Dialog.Description>
          </header>

          <div className="space-y-7">
            <Section title="Modo" value={MODES.find((m) => m.value === appearance.mode)?.label}>
              <div role="radiogroup" aria-label="Modo" className="grid grid-cols-3 gap-3">
                {MODES.map((mode) => {
                  const selected = appearance.mode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ mode: mode.value })}
                      className="group flex flex-col gap-2 text-left outline-none"
                    >
                      <span
                        className={cn(
                          "rounded-panel p-0.5 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-brand/60",
                          selected ? selectedRing : "ring-1 ring-border group-hover:ring-ink-faint"
                        )}
                      >
                        <ModePreview mode={mode.value} />
                      </span>
                      <span className={cn("text-caption", selected ? "font-medium text-ink" : "text-ink-soft")}>
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section
              title="Cor de destaque"
              value={ACCENTS.find((a) => a.value === appearance.accent)?.label}
            >
              <div role="radiogroup" aria-label="Cor de destaque" className="flex gap-3">
                {ACCENTS.map((accent) => {
                  const selected = appearance.accent === accent.value;
                  return (
                    <button
                      key={accent.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={accent.label}
                      title={accent.label}
                      onClick={() => update({ accent: accent.value })}
                      className={cn(
                        "size-8 rounded-full outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/60",
                        selected
                          ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                          : "hover:ring-2 hover:ring-ink-faint hover:ring-offset-2 hover:ring-offset-surface"
                      )}
                      style={{ background: accent.color }}
                    />
                  );
                })}
              </div>
            </Section>

            <Section title="Fonte" value={FONTS.find((f) => f.value === appearance.font)?.label}>
              <div role="radiogroup" aria-label="Fonte" className="grid grid-cols-2 gap-3">
                {FONTS.map((font) => {
                  const selected = appearance.font === font.value;
                  return (
                    <button
                      key={font.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update({ font: font.value })}
                      className={cn(
                        "flex items-center gap-3 rounded-panel bg-surface-muted p-3 text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/60",
                        selected ? selectedRing : "ring-1 ring-transparent hover:ring-ink-faint"
                      )}
                    >
                      <span className="text-title leading-none" style={{ fontFamily: font.family }}>
                        Aa
                      </span>
                      <span>
                        <span className="block text-body font-medium">{font.label}</span>
                        <span className="block text-caption text-ink-soft">{font.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Section>
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
