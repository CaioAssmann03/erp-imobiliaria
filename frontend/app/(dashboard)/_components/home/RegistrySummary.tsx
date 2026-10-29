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
    <>
      <Link
        href={group.href}
        className="font-medium text-ink tabular-nums underline-offset-4 transition-colors hover:underline"
      >
        {summary.total} {pick(group.noun, summary.total)}
      </Link>{" "}
      <span className="text-ink-faint">
        ({summary.active} {pick(group.adjective, summary.active)})
      </span>
    </>
  );
}

/**
 * Client Component: o resumo dos cadastros como uma frase no cabeçalho do painel, cada total com link para a sua lista
 * ("8 condomínios (7 ativos), 53 unidades (46 ativas) e 30 pessoas (28 ativas)"). Enquanto carrega, ou se a API falhar, fica a descrição
 * de sempre.
 */
export function RegistrySummary() {
  const { data: dash } = useDashboardRetrieve();
  if (!dash) return <span>{FALLBACK}</span>;

  return (
    <span>
      {GROUPS.map((group, position) => (
        <Fragment key={group.key}>
          <Group group={group} summary={dash[group.key]} />
          {position < GROUPS.length - 2 ? ", " : position === GROUPS.length - 2 ? " e " : "."}
        </Fragment>
      ))}
    </span>
  );
}
