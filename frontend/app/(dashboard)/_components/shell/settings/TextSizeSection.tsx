import { TEXT_SIZES, type Appearance } from "@/lib/theme/appearance";

import { SegmentedControl } from "./SegmentedControl";
import { SettingsRow } from "./SettingsSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

export function TextSizeSection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsRow title="Tamanho do texto" description="Aumenta os textos e os espaços do sistema inteiro.">
      <SegmentedControl
        label="Tamanho do texto"
        value={appearance.text}
        options={TEXT_SIZES.map((size) => ({ value: size.value, label: `${size.label} · ${size.hint}` }))}
        onChange={(text) => onChange({ text })}
      />
    </SettingsRow>
  );
}
