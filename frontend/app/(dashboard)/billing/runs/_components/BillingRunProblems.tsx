import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BillingRun } from "@/lib/api/generated/models";
import { describeProblem, problemFix } from "@/lib/billing-run-problems";

/** Uma linha por problema: a unidade (ou o condomínio inteiro), o que houve em português e onde corrigir. */
export function BillingRunProblems({ run }: { run: BillingRun }) {
  if (run.problems.length === 0) {
    return <p className="text-body text-ink-soft">Nenhum problema: tudo o que devia ser emitido foi emitido.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Unidade</TableHead>
          <TableHead>O que houve</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {run.problems.map((problem, index) => {
          const fix = problemFix(problem.code, { condominiumId: run.condominium, unitId: problem.unit });
          return (
            <TableRow key={`${problem.unit ?? "condominium"}-${problem.code}-${index}`}>
              <TableCell className="whitespace-nowrap">{problem.unit_name ?? "Condomínio todo"}</TableCell>
              <TableCell>{describeProblem(problem.code)}</TableCell>
              <TableCell className="text-right">
                {fix && (
                  <Link href={fix.href} className="text-ink underline">
                    {fix.label}
                  </Link>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
