import { formatCode } from "@/lib/format/format";

/** O conteúdo de uma linha de pessoa: o código (cinza no separador) e o nome em cima, e embaixo o `detail` (documento, papel, unidades...). */
export function PersonRowContent({ code, name, detail }: { code: number; name: string; detail: string }) {
  return (
    <>
      <span className="block truncate text-body font-medium">
        <span className="tabular-nums">{formatCode(code)}</span>
        <span className="text-ink-faint"> · </span>
        {name}
      </span>
      <span className="block truncate text-caption text-ink-soft">{detail}</span>
    </>
  );
}
