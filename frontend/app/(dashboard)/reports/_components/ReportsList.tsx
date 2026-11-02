"use client";

import Link from "next/link";
import { useState } from "react";

import { ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect } from "@/components/filters/ScopeSelect";
import { REPORT_GROUPS, REPORTS, REPORTS_URL, type ReportGroup } from "@/lib/reports/report-catalog";
import { RegistryList, RegistryListItem } from "@/components/layout/RegistryList";

/**
 * Client Component: a coluna da esquerda de Relatórios, no desenho das listas dos cadastros: o título, o cartão branco do alto (aqui o assunto,
 * já que não há busca nem condomínio, num `ScopeSelect` como o dos outros módulos) e as linhas com o nome e, embaixo, o que o relatório mostra. O aberto
 * fica marcado (fundo branco e a barra), os demais apagados enquanto há um aberto; um relatório sem tela fica apagado, com "Em breve".
 */
export function ReportsList({ openHref, className }: { openHref: string | null; className?: string }) {
  const [group, setGroup] = useState<ReportGroup | "">("");
  const reports = REPORTS.filter((report) => group === "" || report.group === group);

  return (
    <RegistryList
      label="Relatórios"
      title={
        <Link href={REPORTS_URL} className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Relatórios
        </Link>
      }
      toolbar={
        <ScopeSearchCard
          scopes={
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Assunto"
              value={group}
              allLabel="Todos os assuntos"
              onChange={(next) => setGroup(next as ReportGroup | "")}
              options={REPORT_GROUPS.map((option) => ({ value: option, label: option }))}
            />
          }
        />
      }
      navLabel="Lista de relatórios"
      isLoading={false}
      isEmpty={false}
      emptyMessage=""
      className={className}
    >
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
        return report.href ? (
          <RegistryListItem key={report.title} href={report.href} isOpen={isOpen} dimmed={Boolean(openHref)}>
            {content}
          </RegistryListItem>
        ) : (
          <li key={report.title}>
            <div aria-disabled="true" className="rounded-panel px-3 py-2 opacity-50">
              {content}
            </div>
          </li>
        );
      })}
    </RegistryList>
  );
}
