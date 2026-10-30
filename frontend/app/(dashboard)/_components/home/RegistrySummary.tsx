"use client";

import Link from "next/link";
import { Fragment } from "react";

import { useDashboardRetrieve } from "@/lib/api/generated";
import type { Summary } from "@/lib/api/generated/models";

const FALLBACK = "O que pede atenção na administração de condomínios, locações, vendas e financeiro.";

const GROUPS = [
  { key: "condominiums", href: "/condominiums", noun: ["condomínio", "condomínios"], adjective: ["ativo", "ativos"] },
  { key: "units", href: "/condominiums/units", noun: ["unidade", "unidades"], adjective: ["ativa", "ativas"] },
  { key: "persons", href: "/condominiums/persons", noun: ["pessoa", "pessoas"], adjective: ["ativa", "ativas"] },
] as const;

const pick = (pair: readonly [string, string], amount: number) => (amount === 1 ? pair[0] : pair[1]);

function Group({ group, summary }: { group: (typeof GROUPS)[number]; summary: Summary }) {
  return (
    <Link
      href={group.href}
      title={`${summary.active} ${pick(group.adjective, summary.active)}`}
      className="tabular-nums underline-offset-4 transition-colors hover:text-ink hover:underline"
    >
      {summary.total} {pick(group.noun, summary.total)}
    </Link>
  );
}

/**
 * Client Component: o resumo dos cadastros numa linha discreta sob o cumprimento, só os totais com link para a lista de cada um
 * ("8 condomínios · 53 unidades · 30 pessoas"); quantos estão ativos aparece ao passar o mouse. Enquanto carrega, ou se a API falhar, fica a
 * descrição de sempre.
 */
export function RegistrySummary() {
  const { data: dash } = useDashboardRetrieve();
  if (!dash) return <span>{FALLBACK}</span>;

  return (
    <span className="flex flex-wrap items-center gap-x-2">
      {GROUPS.map((group, position) => (
        <Fragment key={group.key}>
          {position > 0 && <span aria-hidden>·</span>}
          <Group group={group} summary={dash[group.key]} />
        </Fragment>
      ))}
    </span>
  );
}
