import { cn } from "@/lib/utils";

import { SettingsRow } from "./SettingsSection";

/** Uma configuração de liga/desliga: a linha com o interruptor à direita. */
export function SettingsSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <SettingsRow title={title} description={description}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-10 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
          checked ? "bg-brand" : "bg-ink-faint/50"
        )}
      >
        <span
          aria-hidden
          className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-card transition-transform", checked && "translate-x-4")}
        />
      </button>
    </SettingsRow>
  );
}
