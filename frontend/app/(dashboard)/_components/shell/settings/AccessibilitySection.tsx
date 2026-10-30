import type { Appearance } from "@/lib/appearance";

import { SettingsGroup } from "./SettingsSection";
import { SettingsSwitch } from "./SettingsSwitch";
import { TextSizeSection } from "./TextSizeSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

/** Texto maior e menos movimento. */
export function AccessibilitySection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsGroup>
      <TextSizeSection appearance={appearance} onChange={onChange} />
      <SettingsSwitch
        title="Reduzir animações"
        description="Tira as transições e os movimentos das janelas, menus e listas."
        checked={appearance.motion === "reduced"}
        onChange={(checked) => onChange({ motion: checked ? "reduced" : "full" })}
      />
    </SettingsGroup>
  );
}
