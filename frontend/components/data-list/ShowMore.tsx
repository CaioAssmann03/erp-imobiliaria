import { LIST_PAGE_SIZE } from "@/lib/list-size";

/**
 * O rodapé de uma lista que mostra só os primeiros registros: a contagem e, havendo mais, o botão que traz mais uns
 * (`LIST_PAGE_SIZE`). `noun` é o nome no plural entre parênteses, como "condomínio(s)".
 */
export function ShowMore({ shown, total, noun, onMore }: { shown: number; total: number; noun: string; onMore: () => void }) {
  if (total <= shown) return <p className="px-1 text-center text-caption text-ink-soft">{`${total} ${noun}`}</p>;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-caption text-ink-soft">{`${shown} de ${total} ${noun}`}</p>
      <button
        type="button"
        onClick={onMore}
        className="h-9 w-full rounded-control text-body font-medium text-ink-soft outline-none transition-colors hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        Mostrar mais {Math.min(LIST_PAGE_SIZE, total - shown)}
      </button>
    </div>
  );
}
