import { ACCENTS, type Appearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

import { SettingsSection } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function AccentSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsSection
      title="Cor de destaque"
      value={ACCENTS.find((a) => a.value === appearance.accent)?.label}
    >
      <div role="radiogroup" aria-label="Cor de destaque" className="flex justify-between sm:justify-start sm:gap-3">
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
              onClick={() => onChange({ accent: accent.value })}
              className={cn(
                "size-10 rounded-full outline-none sm:size-8 transition-shadow focus-visible:ring-2 focus-visible:ring-brand/60",
                selected
                  ? "ring-2 ring-ink ring-offset-2 ring-offset-surface"
                  : "hover:ring-2 hover:ring-ink-faint hover:ring-offset-2 hover:ring-offset-surface"
              )}
              style={{ background: accent.color }}
            />
          );
        })}
      </div>
    </SettingsSection>
  );
}
