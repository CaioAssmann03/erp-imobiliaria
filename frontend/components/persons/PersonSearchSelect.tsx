"use client";

import { useState } from "react";

import { SearchCombobox } from "@/components/filters/SearchCombobox";
import { SCOPE_SELECT_MAX_RESULTS } from "@/components/filters/ScopeSelect";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePersonsList, usePersonsRetrieve } from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { formattedPersonDocument } from "@/lib/persons/person-document";
import { CONDOMINIUMS_MODULE } from "@/lib/persons/person-module";

/**
 * O campo para escolher uma pessoa: o próprio campo é digitável (nome, CPF/CNPJ ou ID), a busca vai ao servidor e a lista mostra poucas por vez
 * (`SearchCombobox`). A pessoa já escolhida entra sempre na lista, para o campo mostrar o nome dela. `onChange` recebe o id (vazio ao limpar) e a pessoa.
 */
export function PersonSearchSelect({
  id,
  label,
  value,
  onChange,
  placeholder = "Busque por nome ou CPF/CNPJ",
  invalid,
  describedBy,
  clearable,
  disabled,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string, person: Person | null) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  clearable?: boolean;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const term = useDebouncedValue(search.trim());
  const { data: found } = usePersonsList({ ...(term ? { query: term } : {}), limit: SCOPE_SELECT_MAX_RESULTS, person_module: CONDOMINIUMS_MODULE });
  const { data: current } = usePersonsRetrieve(value, { query: { enabled: value !== "" } });

  const people: Person[] = [...(found?.results ?? [])];
  if (current && !people.some((person) => person.id === current.id)) people.unshift(current);

  return (
    <SearchCombobox
      id={id}
      label={label}
      value={value}
      placeholder={placeholder}
      invalid={invalid}
      describedBy={describedBy}
      clearable={clearable}
      disabled={disabled}
      onSearch={setSearch}
      options={people.map((person) => ({ value: person.id, label: [person.name, formattedPersonDocument(person)].filter(Boolean).join(" · ") }))}
      onChange={(next) => onChange(next, people.find((person) => person.id === next) ?? null)}
    />
  );
}
