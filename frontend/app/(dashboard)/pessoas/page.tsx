"use client";

import Link from "next/link";
import { useState } from "react";

import { usePessoasDestroy, usePessoasList } from "@/lib/api/generated";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export default function PessoasPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = usePessoasList({ search: search || undefined });
  const destroyMutation = usePessoasDestroy();

  const handleDelete = (id: number, nome: string) => {
    if (!window.confirm(`Excluir a pessoa "${nome}"?`)) return;
    destroyMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Pessoas
        </h1>
        <Link href="/pessoas/novo" className={buttonPrimaryClass}>
          Nova pessoa
        </Link>
      </div>

      <input
        className={`${inputClass} mb-4 max-w-sm`}
        placeholder="Buscar por nome, CPF/CNPJ ou email..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading && <p className="text-sm text-zinc-500">Carregando...</p>}

      {!isLoading && (data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-zinc-500">Nenhuma pessoa cadastrada.</p>
      )}

      {!isLoading && (data?.results.length ?? 0) > 0 && (
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Nome</th>
              <th className={thClass}>CPF/CNPJ</th>
              <th className={thClass}>Celular</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Status</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {data?.results.map((pessoa) => (
              <tr key={pessoa.id}>
                <td className={tdClass}>
                  <Link
                    href={`/pessoas/${pessoa.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {pessoa.nome}
                  </Link>
                </td>
                <td className={tdClass}>{pessoa.cpf_cnpj}</td>
                <td className={tdClass}>{pessoa.celular || "—"}</td>
                <td className={tdClass}>{pessoa.email || "—"}</td>
                <td className={tdClass}>{pessoa.ativo ? "Ativo" : "Inativo"}</td>
                <td className={tdClass}>
                  <button
                    type="button"
                    className={buttonDangerClass}
                    onClick={() => handleDelete(pessoa.id, pessoa.nome)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
