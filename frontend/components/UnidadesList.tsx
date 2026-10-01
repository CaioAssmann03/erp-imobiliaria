"use client";

import Link from "next/link";

import {
  useBlocosList,
  useCondominiosRetrieve,
  useUnidadesDestroy,
  useUnidadesList,
} from "@/lib/api/generated";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  tableClass,
  tdClass,
  thClass,
} from "@/lib/ui";

interface UnidadesListProps {
  condominioId: number;
}

export function UnidadesList({ condominioId }: UnidadesListProps) {
  const { data: condominio } = useCondominiosRetrieve(condominioId);
  const { data: blocos } = useBlocosList({ condominio: condominioId });
  const { data: unidades, isLoading, refetch } = useUnidadesList({
    condominio: condominioId,
  });
  const destroyMutation = useUnidadesDestroy();

  const blocoNome = (blocoId: number | null | undefined) => {
    if (!blocoId) return "—";
    return blocos?.results.find((bloco) => bloco.id === blocoId)?.nome ?? "—";
  };

  const handleDelete = (id: number, nome: string) => {
    if (!window.confirm(`Excluir a unidade "${nome}"?`)) return;
    destroyMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/condominios"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← Condomínios
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Unidades {condominio ? `— ${condominio.nome}` : ""}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/condominios/${condominioId}`}
            className={buttonSecondaryClass}
          >
            Editar condomínio
          </Link>
          <Link
            href={`/condominios/${condominioId}/unidades/novo`}
            className={buttonPrimaryClass}
          >
            Nova unidade
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">Carregando...</p>}

      {!isLoading && (unidades?.results.length ?? 0) === 0 && (
        <p className="text-sm text-zinc-500">Nenhuma unidade cadastrada.</p>
      )}

      {!isLoading && (unidades?.results.length ?? 0) > 0 && (
        <table className={tableClass}>
          <thead>
            <tr>
              <th className={thClass}>Unidade</th>
              <th className={thClass}>Bloco</th>
              <th className={thClass}>Tipo</th>
              <th className={thClass}>Proprietário(s)/Locatário(s)</th>
              <th className={thClass}>Status</th>
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {unidades?.results.map((unidade) => (
              <tr key={unidade.id}>
                <td className={tdClass}>
                  <Link
                    href={`/condominios/${condominioId}/unidades/${unidade.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {unidade.nome_unidade}
                  </Link>
                </td>
                <td className={tdClass}>{blocoNome(unidade.bloco)}</td>
                <td className={tdClass}>{unidade.tipo}</td>
                <td className={tdClass}>
                  {unidade.partes.length === 0
                    ? "—"
                    : unidade.partes
                        .map(
                          (parte) =>
                            `${parte.pessoa_detalhe.nome} (${
                              parte.papel === "proprietario" ? "Prop." : "Loc."
                            })`
                        )
                        .join(", ")}
                </td>
                <td className={tdClass}>{unidade.ativo ? "Ativo" : "Inativo"}</td>
                <td className={tdClass}>
                  <button
                    type="button"
                    className={buttonDangerClass}
                    onClick={() => handleDelete(unidade.id, unidade.nome_unidade)}
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
