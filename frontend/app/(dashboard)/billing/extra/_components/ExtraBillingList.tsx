"use client";

import { keepPreviousData } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ShowMore } from "@/components/data-list";
import { ScopeDivider, ScopeSearchCard } from "@/components/filters/ScopeSearchCard";
import { ScopeSelect, type ScopeOption } from "@/components/filters/ScopeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGrowingLimit } from "@/hooks/use-growing-limit";
import { useBillingDocumentsList, useCondominiumsList } from "@/lib/api/generated";
import type { BillingDocument } from "@/lib/api/generated/models";
import { formatCode } from "@/lib/billing/billing-entry-payload";
import { extraBillingUrl, newExtraBillingUrl } from "@/lib/billing/extra-billing-workspace";
import { cn } from "@/lib/utils";

import { ExtraBillingListItem } from "./ExtraBillingListItem";
import { useExtraScope } from "./use-extra-scope";

/** Quantas opções o seletor de unidade e pagador lê da API de cada vez (a busca digitada é da API). */
const MAX_OPTIONS_SOURCE = 100;

/** As unidades e os pagadores dos boletos, sem repetir, por nome: o valor diz de que lado vem (`unit:<id>` ou `payer:<id>`). */
function unitAndPayerOptions(documents: readonly BillingDocument[]): ScopeOption[] {
  const units = new Map<string, string>();
  const payers = new Map<string, string>();
  for (const document of documents) {
    units.set(document.unit, document.unit_name);
    payers.set(document.payer, document.payer_name);
  }
  const byLabel = (a: ScopeOption, b: ScopeOption) => a.label.localeCompare(b.label, "pt-BR", { numeric: true });
  return [
    ...[...units].map(([id, name]): ScopeOption => ({ value: `unit:${id}`, label: `Unidade ${name}` })).sort(byLabel),
    ...[...payers].map(([id, name]): ScopeOption => ({ value: `payer:${id}`, label: `Pagador ${name}`, title: name })).sort(byLabel),
  ];
}

/** O filtro escolhido no seletor vira o parâmetro da API (`unit` ou `payer`). */
function filterParams(filter: string): { unit?: string; payer?: string } {
  const [kind, id] = filter.split(":");
  if (!id) return {};
  return kind === "unit" ? { unit: id } : { payer: id };
}

/**
 * Client Component: a coluna da esquerda do boleto extra, no padrão da lista de condomínios: título com **+** de novo boleto, o condomínio como escopo
 * (seletor; fica na URL, então o formulário e o boleto aberto o seguem), ao lado dele um seletor com caixa de busca (feita na API) das unidades e dos pagadores dos boletos
 * do condomínio (escolher um filtra a lista) e os boletos extras já emitidos, os mais novos primeiro, 10 de cada vez, com o aberto marcado.
 */
export function ExtraBillingList({ openDocumentId, className }: { openDocumentId: string | null; className?: string }) {
  const router = useRouter();
  const scope = useExtraScope();
  // O filtro vale só para o condomínio em que foi escolhido: trocar de condomínio o limpa.
  const [picked, setPicked] = useState({ condominium: "", value: "", label: "" });
  const filter = picked.condominium === scope.condominium ? picked.value : "";
  const [optionSearch, setOptionSearch] = useState("");
  const optionTerm = useDebouncedValue(optionSearch.trim());

  const hasScope = scope.condominium !== "";
  const { limit, showMore } = useGrowingLimit(`${scope.condominium}|${filter}`);
  const { data: condominiums } = useCondominiumsList({ limit: 100 });
  const { data: source } = useBillingDocumentsList(
    { condominium: scope.condominium, kind: "extra", limit: MAX_OPTIONS_SOURCE, ...(optionTerm ? { query: optionTerm } : {}) },
    { query: { enabled: hasScope, placeholderData: keepPreviousData } }
  );
  // A opção escolhida continua na lista mesmo quando a busca digitada depois não a traz.
  const found = unitAndPayerOptions(source?.results ?? []);
  const filterOptions = filter && !found.some((option) => option.value === filter) ? [{ value: filter, label: picked.label }, ...found] : found;
  const { data, isLoading, isPlaceholderData } = useBillingDocumentsList(
    { condominium: scope.condominium, kind: "extra", limit, ...filterParams(filter) },
    { query: { enabled: hasScope, placeholderData: keepPreviousData } }
  );
  const documents = data?.results ?? [];
  const plusClass = "flex size-8 items-center justify-center rounded-control text-ink-soft outline-none transition-colors";

  return (
    <aside
      aria-label="Boleto extra"
      className={cn("w-full shrink-0 flex-col gap-3 lg:sticky lg:top-[4.25rem] lg:h-[calc(100vh-5.25rem)] lg:w-80 2xl:w-96", className)}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-heading">Boleto extra</h2>
        {hasScope ? (
          <Link
            href={newExtraBillingUrl(scope)}
            aria-label="Novo boleto extra"
            title="Novo boleto extra"
            className={cn(plusClass, "hover:bg-surface hover:text-ink focus-visible:ring-2 focus-visible:ring-ring")}
          >
            <Plus className="size-5" />
          </Link>
        ) : (
          <span aria-disabled="true" title="Escolha o condomínio para emitir um boleto extra" className={cn(plusClass, "cursor-not-allowed opacity-40")}>
            <Plus className="size-5" />
          </span>
        )}
      </div>

      <ScopeSearchCard
        scopes={
          <>
            <ScopeSelect
              variant="segment"
              className="flex-1"
              label="Condomínio"
              value={scope.condominium}
              placeholder="Selecione o condomínio"
              onChange={(condominium) => router.push(extraBillingUrl({ condominium }))}
              options={(condominiums?.results ?? []).map((item) => ({
                value: item.id,
                label: `${formatCode(item.code)} · ${item.name}`,
                title: item.name,
              }))}
            />
            {hasScope && (
              <>
                <ScopeDivider />
                <ScopeSelect
                  variant="segment"
                  className="w-28"
                  label="Unidade ou pagador"
                  value={filter}
                  placeholder="Unidade ou pagador"
                  allLabel="Todos"
                  options={filterOptions}
                  onSearch={setOptionSearch}
                  onChange={(value) => setPicked({ condominium: scope.condominium, value, label: filterOptions.find((option) => option.value === value)?.label ?? "" })}
                />
              </>
            )}
          </>
        }
      />

      <nav aria-label="Lista de boletos extras" className={cn("min-h-0 flex-1 overflow-y-auto pr-1 transition-opacity", isPlaceholderData && "opacity-60")}>
        {!hasScope ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">Escolha o condomínio para ver os boletos extras dele.</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-12 rounded-panel" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="px-2 py-6 text-center text-body text-ink-soft">{filter ? "Nenhum boleto extra para essa unidade ou pagador." : "Nenhum boleto extra emitido ainda."}</p>
        ) : (
          <ul className="space-y-0.5">
            {documents.map((document) => (
              <ExtraBillingListItem key={document.id} document={document} scope={scope} isOpen={document.id === openDocumentId} dimmed={Boolean(openDocumentId)} />
            ))}
          </ul>
        )}
      </nav>

      {hasScope && data && <ShowMore shown={documents.length} total={data.count} noun="boleto(s)" onMore={showMore} />}
    </aside>
  );
}
