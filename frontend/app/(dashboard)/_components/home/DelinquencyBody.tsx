"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { useBillingDocumentsDelinquency } from "@/lib/api/generated";
import { cn } from "@/lib/utils";

import { Caption } from "./widgets/Caption";
import { brl } from "./widgets/format";

const SHOWN = 3;

/** Client Component: o que a imobiliária tem a receber e já venceu: o total, a quantidade de boletos e os condomínios que mais devem (o relatório de inadimplência). */
export function DelinquencyBody() {
  const { data, isLoading } = useBillingDocumentsDelinquency();
  const late = (data?.count ?? 0) > 0;
  const top = [...(data?.by_condominium ?? [])].sort((a, b) => Number(b.total_amount) - Number(a.total_amount)).slice(0, SHOWN);

  if (isLoading) return <Skeleton className="h-24 rounded-panel" />;

  return (
    <>
      <div className={cn("text-title tabular-nums", late && "text-danger")}>{data ? brl(data.total_amount) : "–"}</div>
      <Caption>
        {!data ? "" : late ? `${data.count} boleto${data.count === 1 ? "" : "s"} vencido${data.count === 1 ? "" : "s"} e não pago${data.count === 1 ? "" : "s"}` : "Nenhum boleto vencido"}
      </Caption>
      {top.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {top.map((item) => (
            <li key={item.condominium_id}>
              <Link href={`/reports/delinquency?condominium=${item.condominium_id}`} className="flex items-baseline justify-between gap-3 py-2 transition-colors hover:text-ink">
                <span className="min-w-0 truncate text-ink-soft">{item.condominium_name}</span>
                <span className="shrink-0 tabular-nums">{brl(item.total_amount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
