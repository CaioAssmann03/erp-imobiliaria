"use client";

import { useCondominiumsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/format/format";

import { ScopeSelect } from "./ScopeSelect";

/**
 * A metade larga do escopo das listas laterais: o condomínio (`0007 · Nome`, e só o nome no botão). Sem `allLabel` o escopo é obrigatório e vale
 * `placeholder` enquanto nada foi escolhido; com ele a primeira opção limpa o escopo ("Todos os condomínios"). Lê os 100 primeiros condomínios (a
 * mesma consulta de todo o app, então não pede de novo).
 */
export function CondominiumScopeSelect({
  value,
  onChange,
  placeholder = "Selecione o condomínio",
  allLabel,
}: {
  value: string;
  onChange: (condominium: string) => void;
  placeholder?: string;
  allLabel?: string;
}) {
  const { data } = useCondominiumsList({ limit: 100 });

  return (
    <ScopeSelect
      variant="segment"
      className="flex-1"
      label="Condomínio"
      value={value}
      placeholder={placeholder}
      allLabel={allLabel}
      onChange={onChange}
      options={(data?.results ?? []).map((item) => ({ value: item.id, label: `${formatCode(item.code)} · ${item.name}`, title: item.name }))}
    />
  );
}
