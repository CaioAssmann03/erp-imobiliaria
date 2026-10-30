"use client";

import { Check, Plus } from "lucide-react";
import { useState } from "react";

import { ACCENTS, CUSTOM_ACCENT, DEFAULT_APPEARANCE, isHexColor, type Appearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

import { SettingsRow } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

const RAINBOW = "conic-gradient(from 0deg, #ff4d4d, #ffb84d, #f2e94d, #4dd16f, #4dc3ff, #7a4dff, #ff4da6, #ff4d4d)";
const FALLBACK_CUSTOM = "#f05a28";

/** O código da cor digitado: aceita com ou sem #, em maiúsculas ou minúsculas. */
const normalizeHex = (text: string) => {
  const hex = text.trim().replace(/^#?/, "#");
  return isHexColor(hex) ? hex.toLowerCase() : null;
};

/**
 * A cor de destaque: as cores prontas (o laranja é o padrão) e, ao lado, o seletor livre: um círculo que abre o seletor de cor do aparelho e
 * um campo com o código (#rrggbb). Escolher uma cor livre passa `accent` para `custom`; clicar numa pronta volta a ela.
 */
export function AccentSection({ appearance, onChange }: SectionProps) {
  const isCustom = appearance.accent === CUSTOM_ACCENT && isHexColor(appearance.accentCustom);
  const customColor = isHexColor(appearance.accentCustom) ? appearance.accentCustom : FALLBACK_CUSTOM;
  const [draft, setDraft] = useState<string | null>(null);

  const currentLabel = isCustom
    ? `Personalizada ${appearance.accentCustom.toUpperCase()}`
    : (ACCENTS.find((accent) => accent.value === appearance.accent)?.label ?? "");
  const pickCustom = (hex: string) => onChange({ accent: CUSTOM_ACCENT, accentCustom: hex });

  return (
    <SettingsRow title="Cor de destaque" description={`Botões, marcações e links. Atual: ${currentLabel}.`} stacked>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div role="radiogroup" aria-label="Cores prontas" className="flex flex-wrap items-center gap-2.5">
          {ACCENTS.map((accent) => {
            const selected = !isCustom && appearance.accent === accent.value;
            return (
              <button
                key={accent.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={accent.value === DEFAULT_APPEARANCE.accent ? `${accent.label} (padrão)` : accent.label}
                title={accent.value === DEFAULT_APPEARANCE.accent ? `${accent.label} (padrão)` : accent.label}
                onClick={() => onChange({ accent: accent.value })}
                style={{ background: accent.color }}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-white outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/60",
                  selected
                    ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                    : "hover:ring-2 hover:ring-ink-faint hover:ring-offset-2 hover:ring-offset-surface"
                )}
              >
                {selected && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
              </button>
            );
          })}
        </div>

        <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />

        <div className="flex items-center gap-2.5">
          <label
            title="Escolher outra cor"
            className={cn(
              "relative flex size-7 cursor-pointer items-center justify-center rounded-full text-white transition-shadow focus-within:ring-2 focus-within:ring-brand/60",
              isCustom ? "ring-2 ring-ink ring-offset-2 ring-offset-surface" : "hover:ring-2 hover:ring-ink-faint hover:ring-offset-2 hover:ring-offset-surface"
            )}
            style={{ background: isCustom ? customColor : RAINBOW }}
          >
            <input
              type="color"
              aria-label="Escolher outra cor"
              value={customColor}
              onChange={(event) => pickCustom(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0"
            />
            {isCustom ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : <Plus aria-hidden className="size-3.5 drop-shadow" strokeWidth={3} />}
          </label>
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            aria-label="Código da cor (#rrggbb)"
            placeholder="#F05A28"
            maxLength={7}
            value={draft ?? (isCustom ? appearance.accentCustom.toUpperCase() : "")}
            onChange={(event) => {
              setDraft(event.target.value);
              const hex = normalizeHex(event.target.value);
              if (hex) pickCustom(hex);
            }}
            onBlur={() => setDraft(null)}
            className="h-8 w-24 rounded-control bg-surface-muted px-2.5 text-body tabular-nums uppercase outline-none placeholder:text-ink-faint focus-visible:ring-2 focus-visible:ring-brand/60"
          />
        </div>
      </div>
    </SettingsRow>
  );
}
