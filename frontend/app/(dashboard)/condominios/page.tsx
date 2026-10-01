"use client";

import Link from "next/link";
import { useState } from "react";

import { useCondominiosDestroy, useCondominiosList } from "@/lib/api/generated";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export default function CondominiosPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useCondominiosList({ search: search || undefined });
  const destroyMutation = useCondominiosDestroy();

  const handleDelete = (id: number, nome: string) => {
    if (!window.confirm(`Excluir o condomínio "${nome}"?`)) return;
    destroyMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Condomínios
        </h1>
        <Link href="/condominios/novo" className={buttonPrimaryClass}>
          Novo condomínio
        </Link>
      </div>

      <input
        className={`${inputClass} mb-4 max-w-sm`}
        placeholder="Buscar por nome ou CNPJ..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading && <p className="text-sm text-zinc-500">Carregando...</p>}

      {!isLoading && (data?.results.length ?? 0) === 0 && (
        <p className="text-sm text-zinc-500">Nenhum condomínio cadastrado.</p>
      )}

      {!isLoading && (data?.results.length ?? 0) > 0 && (
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Nome</th>
              <th className={thClass}>CNPJ</th>
              <th className={thClass}>Cidade/UF</th>
              <th className={thClass}>Status</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {data?.results.map((condominio) => (
              <tr key={condominio.id}>
                <td className={tdClass}>
                  <Link
                    href={`/condominios/${condominio.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {condominio.nome}
                  </Link>
                </td>
                <td className={tdClass}>{condominio.cnpj || "—"}</td>
                <td className={tdClass}>
                  {condominio.cidade ? `${condominio.cidade}/${condominio.uf}` : "—"}
                </td>
                <td className={tdClass}>{condominio.ativo ? "Ativo" : "Inativo"}</td>
                <td className={tdClass}>
                  <div className="flex gap-2">
                    <Link
                      href={`/condominios/${condominio.id}/unidades`}
                      className={buttonSecondaryClass}
                    >
                      Unidades
                    </Link>
                    <button
                      type="button"
                      className={buttonDangerClass}
                      onClick={() => handleDelete(condominio.id, condominio.nome)}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
