import type { Appearance } from "@/lib/theme/appearance";

import { MotionSection } from "./MotionSection";
import { SettingsGroup } from "./SettingsSection";
import { TextSizeSection } from "./TextSizeSection";

interface SectionProps {
  appearance: Appearance;
  onChange: (patch: Partial<Appearance>) => void;
}

/** Texto maior e modo leve (menos movimento e efeitos). */
export function AccessibilitySection({ appearance, onChange }: SectionProps) {
  return (
    <SettingsGroup>
      <TextSizeSection appearance={appearance} onChange={onChange} />
      <MotionSection appearance={appearance} onChange={onChange} />
    </SettingsGroup>
  );
}
