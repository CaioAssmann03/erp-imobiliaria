import { MOTIONS, type Appearance } from "@/lib/theme/appearance";

import { SegmentedControl } from "./SegmentedControl";
import { SettingsRow } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function MotionSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsRow
      stacked
      title="Animações e efeitos"
      description="Reduzidos tira animações, desfoques e efeitos de fundo, e deixa o sistema mais leve. No Automático, isso só acontece se o computador não aguentar (sem aceleração de hardware ou travando) ou se o sistema pedir menos movimento; quem aguenta fica com tudo."
    >
      <SegmentedControl
        label="Animações e efeitos"
        value={appearance.motion}
        options={MOTIONS}
        onChange={(motion) => onChange({ motion })}
        fullWidth
      />
    </SettingsRow>
  );
}
