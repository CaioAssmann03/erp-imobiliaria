"use client";

import { useAssistantEnabled } from "@/components/assistant/use-assistant-enabled";

import { SettingsGroup } from "./SettingsSection";
import { SettingsSwitch } from "./SettingsSwitch";

/** O assistente de ajuda: liga e desliga o botão do canto da tela. */
export function AssistantSection() {
  const [enabled, setEnabled] = useAssistantEnabled();

  return (
    <SettingsGroup>
      <SettingsSwitch
        title="Mostrar o assistente de ajuda"
        description="Um botão no canto inferior direito da tela para tirar dúvidas sobre como o sistema funciona. Ele não vê os seus cadastros."
        checked={enabled}
        onChange={setEnabled}
      />
    </SettingsGroup>
  );
}
