import { FONTS, type Appearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

import { SettingsSection } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function FontSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsSection title="Fonte" value={FONTS.find((f) => f.value === appearance.font)?.label}>
      <div role="radiogroup" aria-label="Fonte" className="grid grid-cols-2 gap-3">
        {FONTS.map((font) => {
          const selected = appearance.font === font.value;
          return (
            <button
              key={font.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ font: font.value })}
              className={cn(
                "flex items-center gap-3 rounded-panel bg-surface-muted p-3 text-left outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/60",
                selected ? "ring-2 ring-brand" : "ring-1 ring-transparent hover:ring-ink-faint"
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
    </SettingsSection>
  );
}
