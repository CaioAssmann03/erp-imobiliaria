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
    { search: debounced },
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
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {isFetching && (
            <div className="px-3 py-2 text-sm text-zinc-500">Buscando...</div>
          )}
          {!isFetching && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500">
              Nenhuma pessoa encontrada.
            </div>
          )}
          {results.map((pessoa) => (
            <button
              type="button"
              key={pessoa.id}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(pessoa);
                setQuery("");
                setOpen(false);
              }}
            >
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {pessoa.nome}
              </div>
              <div className="text-xs text-zinc-500">{pessoa.cpf_cnpj}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
