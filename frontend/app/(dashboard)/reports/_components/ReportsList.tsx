"use client";

import Link from "next/link";
import { useState } from "react";

import { ScopeSearchCard } from "@/components/ScopeSearchCard";
import { REPORT_GROUPS, REPORTS, REPORTS_URL, type ReportGroup } from "@/lib/report-catalog";
import { cn } from "@/lib/utils";

const ALL = "Todos";

/**
 * Client Component: a coluna da esquerda de Relatórios, no desenho das listas dos cadastros: o título, o cartão branco do alto (aqui o assunto,
 * já que não há busca nem condomínio: Todos, Financeiro, Cobrança, Cadastros) e as linhas com o nome e, embaixo, o que o relatório mostra. O aberto
 * fica marcado (fundo branco e a barra), os demais apagados enquanto há um aberto; um relatório sem tela fica apagado, com "Em breve".
 */
export function ReportsList({ openHref, className }: { openHref: string | null; className?: string }) {
  const [group, setGroup] = useState<ReportGroup | typeof ALL>(ALL);
  const reports = REPORTS.filter((report) => group === ALL || report.group === group);

  return (
    <aside
      aria-label="Relatórios"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <h2 className="px-1 text-heading">
        <Link href={REPORTS_URL} className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Relatórios
        </Link>
      </h2>

      <ScopeSearchCard
        scopes={
          <div role="radiogroup" aria-label="Assunto" className="flex h-full w-full items-center">
            {[ALL, ...REPORT_GROUPS].map((option) => {
              const selected = option === group;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setGroup(option as ReportGroup | typeof ALL)}
                  className={cn(
                    "h-full min-w-0 flex-1 truncate rounded-control px-2 text-body outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60",
                    selected ? "bg-ink/[0.07] font-medium text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        }
      />

      <nav aria-label="Lista de relatórios" className="min-h-0 flex-1 overflow-y-auto pr-1">
        <ul className="space-y-0.5">
          {reports.map((report) => {
            const isOpen = report.href !== undefined && report.href === openHref;
            const content = (
              <>
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-body font-medium">{report.title}</span>
                  {!report.href && <span className="shrink-0 text-caption font-normal text-ink-faint">Em breve</span>}
                </span>
                <span className="block truncate text-caption text-ink-soft">{report.description}</span>
              </>
            );
            return (
              <li key={report.title}>
                {report.href ? (
                  <Link
                    href={report.href}
                    aria-current={isOpen ? "page" : undefined}
                    className={cn(
                      "block rounded-panel px-3 py-2 transition-[background-color,opacity] hover:bg-surface",
                      isOpen && "bg-surface shadow-card shadow-[inset_3px_0_0_var(--color-brand)]",
                      openHref && !isOpen && "opacity-60 hover:opacity-100 focus-visible:opacity-100"
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div aria-disabled="true" className="rounded-panel px-3 py-2 opacity-50">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
