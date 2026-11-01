import { StatusText } from "@/components/StatusText";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCode } from "@/lib/format/format";

/**
 * O cabeçalho de um registro aberto no meio do cadastro: o "voltar" (`back`, em geral um `PhoneBackLink`), o código em cinza (como na lista ao lado), o nome
 * e a situação em texto simples. Sem `record` (a consulta ainda não voltou) mostra o esqueleto do título. Os módulos passam a mesma consulta do formulário,
 * então é uma chamada só.
 */
export function RegistryHeader({ back, record }: { back: React.ReactNode; record?: { code: number | undefined; name: string; active: boolean } }) {
  return (
    <>
      {back}
      {record ? (
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-title">
            <span className="tabular-nums text-ink-faint">{formatCode(record.code)}</span>
            <span className="text-ink-faint"> · </span>
            {record.name}
          </h1>
          <StatusText active={record.active} />
        </div>
      ) : (
        <Skeleton className="mb-6 h-9 w-72 rounded-control" />
      )}
    </>
  );
}
