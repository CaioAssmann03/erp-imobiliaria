
import Link from "next/link";

import { CadastrosMensaisChart } from "@/components/charts/CadastrosMensaisChart";
import { PessoasPorTipoChart } from "@/components/charts/PessoasPorTipoChart";
import { UnidadesPorTipoChart } from "@/components/charts/UnidadesPorTipoChart";
import { DotMatrix } from "@/components/DotMatrix";
import { LinkButton } from "@/components/LinkButton";
import { SeeAllLink } from "@/components/SeeAllLink";
import type { Dashboard } from "@/lib/api/generated/models";

export const WIDGET_IDS = [
  "condominios",
  "unidades-ativas",
  "unidades-por-tipo",
  "novos-cadastros",
  "pessoas",
  "pendencias",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

export interface Widget {
  title: string;
  description?: string;
  /** Classes de grade do card no painel. */
  className: string;
  /** Mostra o título/descrição no cabeçalho do card (o modal sempre mostra). */
  showHeader: boolean;
  /** Link "Ver todos" exibido ao passar o mouse no card. */
  seeAll?: { href: string };
  /** `large` = versão ampliada exibida no modal de foco. */
  render: (large: boolean) => React.ReactNode;
}

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-ink-soft">{children}</p>;
}

function TypeList({ items }: { items: { rotulo: string; total: number }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.rotulo} className="flex justify-between">
          <span className="text-ink-soft">{item.rotulo}</span>
          <span className="tabular-nums">{item.total}</span>
        </li>
      ))}
    </ul>
  );
}

export function buildWidgets(dash: Dashboard | undefined): Record<WidgetId, Widget> {
  const fisica = dash?.pessoas.por_tipo.find((t) => t.tipo === "fisica")?.total ?? 0;
  const juridica = dash?.pessoas.por_tipo.find((t) => t.tipo === "juridica")?.total ?? 0;

  return {
    condominios: {
      title: "Condomínios administrados",
      className: "lg:col-span-5",
      showHeader: false,
      render: (large) => (
        <>
          <div className="rounded-panel bg-surface-muted p-4">
            <Caption>Condomínios administrados</Caption>
            <div className="mt-1 text-display tabular-nums">{dash?.condominios.total ?? "–"}</div>
            <div className="mt-4 flex rounded-full bg-surface p-0.5">
              <LinkButton className="flex-1" href="/condominios/novo">
                Novo condomínio
              </LinkButton>
              <LinkButton className="flex-1" variant="ghost" href="/pessoas/novo">
                Nova pessoa
              </LinkButton>
            </div>
          </div>
          <div className="mt-4 flex items-start justify-between gap-6 px-1">
            <div>
              <Caption>Em operação</Caption>
              <div className="text-heading tabular-nums">
                {dash?.condominios.ativos ?? "–"}
                <span className="font-normal text-ink-faint"> de {dash?.condominios.total ?? "–"}</span>
              </div>
            </div>
            {large ? (
              <div className="min-w-40">
                <Caption>Por tipo</Caption>
                <TypeList items={dash?.condominios.por_tipo ?? []} />
              </div>
            ) : (
              <SeeAllLink href="/condominios" />
            )}
          </div>
        </>
      ),
    },

    "unidades-ativas": {
      title: "Unidades ativas",
      description: "Proporção de unidades em operação.",
      className: "lg:col-span-4",
      showHeader: true,
      render: (large) => (
        <>
          <DotMatrix
            filled={dash?.unidades.ativos ?? 0}
            total={dash?.unidades.total ?? 0}
            columns={large ? 40 : 24}
            rows={large ? 10 : 6}
          />
          <div className="mt-4">
            <Caption>{dash?.unidades.total ?? 0} unidades cadastradas</Caption>
            <div className="text-title tabular-nums">
              {dash?.unidades.ativos ?? "–"}
              <span className="text-heading font-normal text-ink-faint"> ativas</span>
            </div>
          </div>
        </>
      ),
    },

    "unidades-por-tipo": {
      title: "Unidades por tipo",
      description: "Distribuição do cadastro",
      className: "lg:col-span-3",
      showHeader: true,
      render: (large) => (
        <>
          <UnidadesPorTipoChart
            data={dash?.unidades.por_tipo ?? []}
            className={large ? "h-72 w-full" : "h-40 w-full"}
            fullLabels={large}
          />
          {large && (
            <div className="mt-4 max-w-xs">
              <TypeList items={dash?.unidades.por_tipo ?? []} />
            </div>
          )}
        </>
      ),
    },

    "novos-cadastros": {
      title: "Novos cadastros",
      description: "Últimos 6 meses",
      className: "lg:col-span-6",
      showHeader: true,
      render: (large) => (
        <CadastrosMensaisChart
          data={dash?.cadastros_por_mes ?? []}
          className={large ? "h-96 w-full" : "h-56 w-full"}
        />
      ),
    },

    pessoas: {
      title: "Pessoas",
      description: "Física × jurídica",
      className: "lg:col-span-3",
      showHeader: true,
      seeAll: { href: "/pessoas" },
      render: (large) => <PessoasPorTipoChart fisica={fisica} juridica={juridica} large={large} />,
    },
    pendencias: {
      title: "Pendências",
      description: "Cadastros ativos que pedem atenção",
      className: "lg:col-span-3",
      showHeader: true,
      render: (large) => <Pendencias pendencias={dash?.pendencias} large={large} />,
    },
  };
}

function Pendencias({
  pendencias,
  large,
}: {
  pendencias: Dashboard["pendencias"] | undefined;
  large: boolean;
}) {
  const rows = [
    {
      count: pendencias?.condominios_incompletos ?? 0,
      label: "Condomínios incompletos",
      detail: "Ativos, sem CNPJ ou sem CEP",
      href: "/condominios",
    },
    {
      count: pendencias?.unidades_sem_vinculo ?? 0,
      label: "Unidades sem vínculo",
      detail: "Ativas, sem proprietário ou locatário",
      href: "/condominios",
    },
    {
      count: pendencias?.pessoas_sem_contato ?? 0,
      label: "Pessoas sem contato",
      detail: "Ativas, sem email nem celular",
      href: "/pessoas",
    },
  ];
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (pendencias && total === 0) {
    return <p className="py-6 text-ink-soft">Nenhuma pendência. Tudo em dia.</p>;
  }

  return (
    <ul className="-mx-2 space-y-1">
      {rows.map((row) => (
        <li key={row.label}>
          <Link
            href={row.href}
            className="flex items-center justify-between gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-muted"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{row.label}</div>
              {large && <div className="text-caption text-ink-soft">{row.detail}</div>}
            </div>
            <span
              className={`text-heading tabular-nums ${row.count > 0 ? "text-ink" : "text-ink-faint"}`}
            >
              {pendencias ? row.count : "–"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

