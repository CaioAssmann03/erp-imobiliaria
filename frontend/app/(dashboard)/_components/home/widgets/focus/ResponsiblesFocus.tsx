"use client";

import { keepPreviousData } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCondominiumsList, useUnitsList } from "@/lib/api/generated";
import type { Dashboard } from "@/lib/api/generated/models";

import { DotMatrix } from "@/app/(dashboard)/_components/home/charts/DotMatrix";
import { FOCUS_PAGE_SIZE, FocusPager, FocusSection, FocusStat, percent } from "./parts";

/** Client Component: a cobertura, os pontos e a lista de quem ainda não tem ninguém para cobrar, 10 por página (uma falha só esvazia a lista). */
export function ResponsiblesFocus({ stats }: { stats: Dashboard["responsibles"] | undefined }) {
  const active = stats?.active_units ?? 0;
  const covered = stats?.with_responsible ?? 0;
  const missing = active - covered;

  const [page, setPage] = useState(1);
  const { data: units } = useUnitsList(
    { pending: "without_responsible", active: true, limit: FOCUS_PAGE_SIZE, ...(page > 1 ? { page } : {}) },
    { query: { placeholderData: keepPreviousData } }
  );
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const condominiumName = (id: string) => condominiums?.results.find((item) => item.id === id)?.name ?? "–";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <FocusStat label="Com responsável" value={stats ? covered : "–"} tone="success" />
        <FocusStat label="Sem responsável" value={stats ? missing : "–"} tone={missing > 0 ? "danger" : "default"} hint="Sem a quem cobrar" />
        <FocusStat label="Cobertura" value={stats ? `${percent(covered, active)}%` : "–"} hint={`${active} unidades ativas`} />
      </div>

      <DotMatrix filled={covered} total={active} columns={40} rows={8} />

      <FocusSection
        title="Unidades sem responsável"
        action={{ href: "/condominiums/units?pending=without_responsible", label: `Ver todas${units ? ` (${units.count})` : ""}` }}
      >
        {units && units.results.length === 0 ? (
          <p className="text-ink-soft">Todas as unidades têm responsável.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Unidade</TableHead>
                <TableHead>Condomínio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(units?.results ?? []).map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <Link href={`/condominiums/${unit.condominium}/units/${unit.id}`} className="font-medium hover:underline">
                      {unit.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-soft">{condominiumName(unit.condominium)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {units && <FocusPager page={page} count={units.count} noun={units.count === 1 ? "unidade" : "unidades"} onPage={setPage} />}
      </FocusSection>
    </div>
  );
}
