import { FONTS, type Appearance } from "@/lib/theme/appearance";

import { SegmentedControl } from "./SegmentedControl";
import { SettingsRow } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function FontSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsRow title="Fonte" description="Cada opção aparece na própria letra.">
      <SegmentedControl
        label="Fonte"
        value={appearance.font}
        options={FONTS.map((font) => ({ value: font.value, label: font.label, style: { fontFamily: font.family } }))}
        onChange={(font) => onChange({ font })}
      />
    </SettingsRow>
  );
}
