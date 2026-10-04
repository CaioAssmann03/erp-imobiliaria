"use client";

import { useEffect, useState } from "react";

import { usePessoasList } from "@/lib/api/generated";
import type { Pessoa } from "@/lib/api/generated/models";
import { inputClass } from "@/lib/ui";

interface PessoaPickerProps {
  onSelect: (pessoa: Pessoa) => void;
  placeholder?: string;
}

export function PessoaPicker({ onSelect, placeholder }: PessoaPickerProps) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = usePessoasList(
    { query: debounced, limit: 8 },
    { query: { enabled: debounced.length >= 2 } }
  );

  const results = data?.results ?? [];

  return (
    <div className="relative">
      <input
        type="text"
        className={inputClass}
        placeholder={placeholder ?? "Buscar por nome ou CPF/CNPJ..."}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && debounced.length >= 2 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-panel bg-surface p-1 text-ink shadow-float">
          {isFetching && (
            <div className="px-3 py-2 text-body text-ink-soft">Buscando...</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-body text-ink-soft">
              Nenhuma pessoa encontrada.
            </div>
          )}
          {results.map((pessoa) => (
            <button
              type="button"
              key={pessoa.id}
              className="block w-full rounded-control px-3 py-2 text-left text-body hover:bg-surface-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(pessoa);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="font-medium text-ink">
                {pessoa.nome}
              </div>
              <div className="text-caption text-ink-soft">{pessoa.cpf_cnpj}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
