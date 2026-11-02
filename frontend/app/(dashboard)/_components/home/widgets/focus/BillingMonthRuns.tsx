"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { useState } from "react";

import { firstDayOfThisMonth } from "@/app/(dashboard)/_components/home/bodies/BillingMonthBody";
import { useBillingRunsList } from "@/lib/api/generated";
import { FOCUS_PAGE_SIZE, FocusList, FocusPager, FocusRow } from "./parts";

/** As execuções da emissão do mês que terminaram com problema (`?has_problem=`, falha ou parcial), 10 por página, cada uma com o link para ver o que falhou. Sem nenhuma, não mostra nada. */
export function BillingMonthBodyRuns() {
  const [page, setPage] = useState(1);
  const { data } = useBillingRunsList(
    { reference_month: firstDayOfThisMonth(), has_problem: true, limit: FOCUS_PAGE_SIZE, ...(page > 1 ? { page } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  if (!data || data.count === 0) return null;

  return (
    <FocusList title="Execuções com problema">
      {data.results.map((run) => (
        <FocusRow
          key={run.id}
          href={`/billing/runs/${run.id}`}
          detail={
            <span className="text-danger">
              {run.failed_count} falha{run.failed_count === 1 ? "" : "s"}
            </span>
          }
        >
          {run.condominium_name}
        </FocusRow>
      ))}
      <FocusPager page={page} count={data.count} noun={data.count === 1 ? "execução" : "execuções"} onPage={setPage} />
    </FocusList>
  );
}
