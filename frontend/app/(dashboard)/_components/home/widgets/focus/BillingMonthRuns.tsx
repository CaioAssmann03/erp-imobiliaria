"use client";

import Link from "next/link";

import { useRunsWithProblem } from "../../BillingMonthBody";
import { FocusSection } from "./parts";

/** As execuções da emissão do mês que terminaram com problema, cada uma com o link para ver o que falhou. */
export function BillingMonthBodyRuns() {
  const { runs } = useRunsWithProblem();
  if (runs.length === 0) return <p className="text-ink-soft">Nenhuma execução com problema neste mês.</p>;

  return (
    <FocusSection title="Execuções com problema" action={{ href: "/billing/runs", label: "Ver execuções" }}>
      <ul className="divide-y divide-border">
        {runs.map((run) => (
          <li key={run.id}>
            <Link href={`/billing/runs/${run.id}`} className="flex items-baseline justify-between gap-3 py-2.5 hover:underline">
              <span className="truncate">{run.condominium_name}</span>
              <span className="shrink-0 text-caption text-danger">
                {run.failed_count} falha{run.failed_count === 1 ? "" : "s"} · {run.issued_count} emitido{run.issued_count === 1 ? "" : "s"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </FocusSection>
  );
}
