import Link from "next/link";

import type { BillingRun } from "@/lib/api/generated/models";
import { describeProblem, problemFix } from "@/lib/billing/billing-run-problems";

/** Um problema por linha, em duas: a unidade (ou o condomínio inteiro) e o que houve em português, com o atalho para corrigir à direita. */
export function BillingRunProblems({ run }: { run: BillingRun }) {
  if (run.problems.length === 0) {
    return <p className="text-body text-ink-soft">Nenhum problema: tudo o que devia ser emitido foi emitido.</p>;
  }

  return (
    <ul className="-my-2 divide-y divide-line">
      {run.problems.map((problem, index) => {
        const fix = problemFix(problem.code, { condominiumId: run.condominium, unitId: problem.unit });
        return (
          <li key={`${problem.unit ?? "condominium"}-${problem.code}-${index}`} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-body font-medium">{problem.unit_name ?? "Condomínio todo"}</p>
              <p className="text-body text-ink-soft">{describeProblem(problem.code)}</p>
            </div>
            {fix && (
              <Link href={fix.href} className="shrink-0 text-body text-ink-soft underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:underline">
                {fix.label}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
