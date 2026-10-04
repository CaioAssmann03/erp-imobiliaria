import type { Mode } from "@/lib/appearance";

/** Miniatura do app nas cores de cada modo (cores fixas: representam o modo, não o tema atual). */
const PREVIEWS = {
  light: { bg: "#e9e9e8", card: "#ffffff", line: "#d9d9d6" },
  dark: { bg: "#101010", card: "#21211f", line: "#3a3a36" },
} as const;

function Half({ mode }: { mode: "light" | "dark" }) {
  const colors = PREVIEWS[mode];
  return (
    <div className="flex h-full flex-1 flex-col gap-1 p-1.5" style={{ background: colors.bg }}>
      <div className="h-1.5 w-6 rounded-full" style={{ background: colors.line }} />
      <div className="flex flex-1 flex-col justify-end gap-1 rounded-md p-1.5" style={{ background: colors.card }}>
        <div className="h-1 w-8 rounded-full" style={{ background: colors.line }} />
        <div className="h-1 w-5 rounded-full" style={{ background: colors.line }} />
      </div>
    </div>
  );
}

export function ModePreview({ mode }: { mode: Mode }) {
  return (
    <div className="flex h-16 w-full overflow-hidden rounded-panel">
      {mode === "system" ? (
        <>
          <Half mode="light" />
          <Half mode="dark" />
        </>
      ) : (
        <Half mode={mode} />
      )}
    </div>
  );
}
