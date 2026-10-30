"use client";

import { useIsApplePlatform } from "@/hooks/use-platform";
import { searchShortcutLabel } from "@/lib/platform";

import { useRailExpanded } from "../use-rail-expanded";
import { SettingsGroup, SettingsRow } from "./SettingsSection";
import { SettingsSwitch } from "./SettingsSwitch";

/** Menu lateral e atalhos de teclado. */
export function NavigationSection() {
  const [expanded, toggle] = useRailExpanded();
  const shortcut = searchShortcutLabel(useIsApplePlatform());

  const shortcuts = [
    { keys: [shortcut], action: "Abrir ou fechar a busca" },
    { keys: ["↑", "↓"], action: "Mover entre os resultados e as opções" },
    { keys: ["Enter", "Tab"], action: "Escolher o resultado destacado" },
    { keys: ["Esc"], action: "Fechar a busca, a lista ou esta janela" },
  ];

  return (
    <>
      <SettingsGroup>
        <SettingsSwitch
          title="Nome dos módulos no menu lateral"
          description="Mostra o nome ao lado dos ícones. Clicar no logo faz o mesmo."
          checked={expanded}
          onChange={toggle}
        />
      </SettingsGroup>

      <SettingsGroup title="Atalhos de teclado">
        {shortcuts.map((item) => (
          <SettingsRow key={item.action} title={item.action} compact>
            <span className="flex items-center gap-1">
              {item.keys.map((key) => (
                <kbd key={key} className="min-w-6 rounded-md bg-surface-muted px-1.5 py-0.5 text-center text-caption font-medium text-ink">
                  {key}
                </kbd>
              ))}
            </span>
          </SettingsRow>
        ))}
      </SettingsGroup>
    </>
  );
}
