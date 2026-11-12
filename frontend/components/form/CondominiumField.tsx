"use client";

import { useId } from "react";

import { SearchCombobox } from "@/components/filters/SearchCombobox";
import { useCondominiumsList } from "@/lib/api/generated";
import { formatCode } from "@/lib/format/format";

import { FormField } from "./FormField";

/**
 * O condomínio de um cadastro que nasce dentro de um condomínio (a nova unidade, o novo bloco, a nova sub-conta, o novo lançamento): um campo com busca,
 * já preenchido com o da lista ao lado. Escolher outro aqui não muda só o campo: quem o usa leva a tela (e, com ela, a lista da esquerda) para o
 * condomínio escolhido, como o `onChange` de cada formulário faz. Não é um campo do `react-hook-form`: o condomínio vem da rota, não do formulário.
 */
export function CondominiumField({ value, onChange, className }: { value: string; onChange: (condominium: string) => void; className?: string }) {
  const id = useId();
  const { data } = useCondominiumsList({ limit: 100 });

  return (
    <FormField id={id} label="Condomínio" required className={className}>
      <SearchCombobox
        id={id}
        label="Condomínio"
        value={value}
        options={(data?.results ?? []).map((item) => ({ value: item.id, label: `${formatCode(item.code)} · ${item.name}`, title: item.name }))}
        placeholder="Selecione"
        onChange={(next) => next && next !== value && onChange(next)}
      />
    </FormField>
  );
}
