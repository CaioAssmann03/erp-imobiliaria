import { MODES, type Appearance } from "@/lib/theme/appearance";

import { SegmentedControl } from "./SegmentedControl";
import { SettingsRow } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function ModeSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsRow title="Tema" description="Claro, escuro ou o mesmo do seu aparelho.">
      <SegmentedControl label="Tema" value={appearance.mode} options={MODES} onChange={(mode) => onChange({ mode })} />
    </SettingsRow>
  );
}
