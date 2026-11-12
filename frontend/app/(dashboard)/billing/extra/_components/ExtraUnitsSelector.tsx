"use client";

import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { SearchCombobox } from "@/components/filters/SearchCombobox";
import { FormField } from "@/components/form/FormField";
import { SegmentedControl } from "@/components/form/SegmentedControl";
import { useBlocksList, useUnitsList } from "@/lib/api/generated";
import { fetchActiveUnits, fetchActiveUnitsOfBlocks } from "@/lib/billing/extra-units";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type Mode = "all" | "blocks" | "specific";

const MODES = [
  { value: "all", label: "Todas as unidades" },
  { value: "blocks", label: "Por bloco" },
  { value: "specific", label: "Unidades específicas" },
] as const;

/** Quantas unidades a busca mostra de uma vez; quem procura digita mais para estreitar. */
const SEARCH_RESULTS = 8;

interface Chosen {
  id: string;
  label: string;
}

/** Um grupo de chips removíveis (os blocos ou as unidades escolhidos). */
function Chips({ items, noun, onRemove }: { items: readonly Chosen[]; noun: string; onRemove: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex h-7 items-center gap-1 rounded-button bg-surface-muted pl-3 pr-1 text-caption text-ink">
          {item.label}
          <button
            type="button"
            aria-label={`Tirar ${noun} ${item.label}`}
            onClick={() => onRemove(item.id)}
            className="flex size-5 items-center justify-center rounded-badge text-ink-soft outline-none hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <X aria-hidden className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * As unidades do boleto extra, pela regra e não uma a uma: **todas as unidades** ativas do condomínio (o padrão), as de **um ou mais blocos** ou **unidades
 * específicas**, buscadas pelo servidor enquanto se digita e mostradas como chips. Nos dois primeiros modos as unidades vêm da API, página por página (sem o
 * corte nas 100 primeiras), e o contador diz quantas entram; no terceiro, só as escolhidas. O formulário guarda sempre a lista de unidades (`units`), então o
 * resto do fluxo não muda. O estado dos modos é local: trocar de condomínio recria o seletor (`key`).
 */
export function ExtraUnitsSelector({ condominium }: { condominium: string }) {
  const { setValue, formState } = useFormContext();
  const [mode, setMode] = useState<Mode>("all");
  const [blocks, setBlocks] = useState<Chosen[]>([]);
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const error = formState.errors.units?.message as string | undefined;

  const { data: blocksData } = useBlocksList({ condominium, limit: 100 }, { query: { enabled: condominium !== "" } });
  const blockOptions = (blocksData?.results ?? []).map((block) => ({ value: block.id, label: block.name }));
  const hasBlocks = (blocksData?.count ?? 0) > 0;

  const blockIds = blocks.map((block) => block.id);
  const { data: resolved, isLoading: resolving } = useQuery({
    queryKey: ["extra-units", condominium, mode, blockIds],
    queryFn: () => (mode === "all" ? fetchActiveUnits(condominium) : fetchActiveUnitsOfBlocks(condominium, blockIds)),
    enabled: condominium !== "" && (mode === "all" || (mode === "blocks" && blockIds.length > 0)),
  });

  const { data: matches } = useUnitsList(
    { condominium, active: true, limit: SEARCH_RESULTS, ...(term ? { query: term } : {}) },
    { query: { enabled: condominium !== "" && mode === "specific" } }
  );
  const blockNameOf = (id: string | null | undefined) => blocksData?.results.find((block) => block.id === id)?.name;
  const unitLabel = (unit: { name: string; block?: string | null }) => [blockNameOf(unit.block), unit.name].filter(Boolean).join(" · ");
  const searchOptions = (matches?.results ?? []).map((unit) => ({ value: unit.id, label: unitLabel(unit) }));

  // O formulário guarda as unidades que entram: as escolhidas, ou as que a regra resolveu.
  const ids = mode === "specific" ? chosen.map((item) => item.id) : mode === "all" || blockIds.length > 0 ? (resolved ?? []).map((unit) => unit.id) : [];
  const idsKey = ids.join(",");
  useEffect(() => {
    // "Todas" é o padrão que o formulário já traz: só uma escolha da pessoa o deixa com "alterações não salvas".
    setValue("units", idsKey === "" ? [] : idsKey.split(",").map((unit) => ({ unit, amount: "" })), { shouldDirty: mode !== "all", shouldValidate: formState.isSubmitted });
  }, [idsKey, mode, setValue, formState.isSubmitted]);

  const count = ids.length;
  const summary =
    mode === "specific"
      ? `${count} selecionada(s)`
      : resolving
        ? "Contando as unidades…"
        : mode === "blocks" && blockIds.length === 0
          ? "Escolha ao menos um bloco"
          : `${count} unidade(s) ativa(s)`;

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-caption font-medium text-ink-soft">
          Unidades <span className="text-brand" aria-hidden="true">*</span>
        </legend>
        <span className="text-caption tabular-nums text-ink-soft">{summary}</span>
      </div>

      <SegmentedControl
        label="Quais unidades"
        value={mode}
        options={hasBlocks ? MODES : MODES.filter((option) => option.value !== "blocks")}
        onChange={(value) => setMode(value as Mode)}
      />

      {mode === "blocks" && (
        <div className="space-y-2">
          <FormField id="extra-units-block" label="Bloco">
            <SearchCombobox
              id="extra-units-block"
              label="Bloco"
              value=""
              options={blockOptions}
              placeholder="Escolha um bloco para incluir"
              onChange={(id) => {
                const block = blocksData?.results.find((item) => item.id === id);
                if (block) setBlocks((current) => (current.some((item) => item.id === block.id) ? current : [...current, { id: block.id, label: block.name }]));
              }}
            />
          </FormField>
          <Chips items={blocks} noun="o bloco" onRemove={(id) => setBlocks((current) => current.filter((item) => item.id !== id))} />
        </div>
      )}

      {mode === "specific" && (
        <div className="space-y-2">
          <FormField id="extra-units-search" label="Buscar unidade">
            <SearchCombobox
              id="extra-units-search"
              label="Buscar unidade"
              value=""
              options={searchOptions}
              placeholder="Digite o número ou o nome da unidade"
              onSearch={setSearch}
              onChange={(id) => {
                const unit = matches?.results.find((item) => item.id === id);
                if (unit) setChosen((current) => (current.some((item) => item.id === unit.id) ? current : [...current, { id: unit.id, label: unitLabel(unit) }]));
              }}
            />
          </FormField>
          <Chips items={chosen} noun="a unidade" onRemove={(id) => setChosen((current) => current.filter((item) => item.id !== id))} />
        </div>
      )}

      <p role={error ? "alert" : undefined} className="min-h-4 text-caption text-danger">
        {error}
      </p>
    </fieldset>
  );
}
