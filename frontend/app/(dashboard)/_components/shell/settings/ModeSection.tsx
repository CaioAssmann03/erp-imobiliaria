import { MODES, type Appearance } from "@/lib/appearance";
import { cn } from "@/lib/utils";

import { ModePreview } from "./ModePreview";
import { SettingsSection } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function ModeSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsSection title="Modo" value={MODES.find((m) => m.value === appearance.mode)?.label}>
      <div role="radiogroup" aria-label="Modo" className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {MODES.map((mode) => {
          const selected = appearance.mode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ mode: mode.value })}
              className="group flex flex-col gap-2 text-left outline-none"
            >
              <span
                className={cn(
                  "rounded-panel p-0.5 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-brand/60",
                  selected ? "ring-2 ring-brand" : "ring-1 ring-border group-hover:ring-ink-faint"
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
    </SettingsSection>
  );
}
