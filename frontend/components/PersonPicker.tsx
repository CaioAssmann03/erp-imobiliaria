"use client";

import { useEffect, useState } from "react";

import { usePersonsList } from "@/lib/api/generated";
import type { Person } from "@/lib/api/generated/models";
import { formattedPersonDocument } from "@/lib/person-document";
import { CONDOMINIUMS_MODULE } from "@/lib/person-module";
import { inputClass } from "@/lib/ui";

interface PersonPickerProps {
  onSelect: (person: Person) => void;
  placeholder?: string;
}

export function PersonPicker({ onSelect, placeholder }: PersonPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // A number is an ID, so even one digit is worth searching.
  const canSearch = debounced.length >= 2 || /^\d+$/.test(debounced);
  const { data, isFetching } = usePersonsList(
    { query: debounced, limit: 8, person_module: CONDOMINIUMS_MODULE },
    { query: { enabled: canSearch } }
  );

  const results = data?.results ?? [];

  return (
    <div className="relative">
      <input
        type="text"
        className={inputClass}
        placeholder={placeholder ?? "Buscar por nome, CPF/CNPJ ou ID..."}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && canSearch && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-panel bg-surface p-1 text-ink shadow-float">
          {isFetching && (
            <div className="px-3 py-2 text-body text-ink-soft">Buscando...</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-body text-ink-soft">
              Nenhuma pessoa encontrada.
            </div>
          )}
          {results.map((person) => (
            <button
              type="button"
              key={person.id}
              className="block w-full rounded-control px-3 py-2 text-left text-body hover:bg-surface-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(person);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="font-medium text-ink">
                {person.name}
              </div>
              <div className="text-caption text-ink-soft">
                {[`ID ${person.code}`, formattedPersonDocument(person)].filter(Boolean).join(" · ")}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
