import { FileText, Folder, Percent, Receipt, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = { title: "Relatórios" };

const REPORTS = [
  {
    href: "/reports/delinquency",
    title: "Inadimplência",
    description: "Boletos vencidos e não pagos, por condomínio, com os dias de atraso e o total.",
    icon: Receipt,
  },
  {
    href: "/reports/accountability",
    title: "Prestação de contas",
    description: "O mês de um condomínio na conta corrente: saldo anterior, créditos, débitos e saldo final.",
    icon: Wallet,
  },
  {
    href: "/reports/unit-sheet",
    title: "Ficha da unidade",
    description: "Tudo de uma unidade em uma página: dados, pessoas, boletos e lançamentos do extrato.",
    icon: FileText,
  },
  {
    href: "/reports/administration-fee",
    title: "Taxa de administração",
    description: "O que a administradora tem a cobrar de cada condomínio no mês, pelo contrato e pelo extrato.",
    icon: Percent,
  },
] as const;

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Relatórios" description="Escolha um relatório. Cada um pode ser baixado em PDF." />
      <ul className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <li key={report.title}>
            <Link
              href={report.href}
              className="flex h-full items-start gap-4 rounded-card bg-card p-5 shadow-card transition-colors hover:bg-surface-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-panel bg-surface-muted text-brand">
                <report.icon className="size-5" />
              </span>
              <span>
                <span className="block text-heading">{report.title}</span>
                <span className="mt-1 block text-body text-ink-soft">{report.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex items-center gap-2 text-caption text-ink-faint">
        <Folder className="size-4" /> Novos relatórios aparecem aqui conforme ficam prontos.
      </p>
    </div>
  );
}
