"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  getUnidadesRetrieveQueryKey,
  useBlocosList,
  useUnidadesCreate,
  useUnidadesPartialUpdate,
  useUnidadesRetrieve,
  useUnidadePartesCreate,
  useUnidadePartesDestroy,
} from "@/lib/api/generated";
import type { Pessoa, Unidade } from "@/lib/api/generated/models";
import { cleanPayload, toOptionalInt } from "@/lib/clean-payload";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  checkboxLabelClass,
  errorTextClass,
  fieldWrapClass,
  inputClass,
  labelClass,
  sectionClass,
  sectionTitleClass,
} from "@/lib/ui";
import { PessoaPicker } from "./PessoaPicker";

const schema = z.object({
  nome_unidade: z.string().min(1, "Informe a unidade"),
  tipo: z.enum(["apartamento", "sala", "loja", "casa", "conjunto", "box", "outros"]),
  numero_moradores: z.string().optional(),
  fracao_ideal: z.string().optional(),
  eh_unidade_sindico: z.boolean(),
  esta_alugada: z.boolean(),
  matricula_imovel: z.string().optional(),
  valor_gas: z.string().optional(),
  valor_agua: z.string().optional(),
  valor_energia: z.string().optional(),
  bloqueio_lancamentos: z.boolean(),
  ativo: z.boolean(),
  bloco: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  nome_unidade: "",
  tipo: "apartamento",
  numero_moradores: "0",
  fracao_ideal: "",
  eh_unidade_sindico: false,
  esta_alugada: false,
  matricula_imovel: "",
  valor_gas: "",
  valor_agua: "",
  valor_energia: "",
  bloqueio_lancamentos: false,
  ativo: true,
  bloco: "",
};

interface UnidadeFormProps {
  condominioId: number;
  unidadeId?: number;
}

export function UnidadeForm({ condominioId, unidadeId }: UnidadeFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = unidadeId !== undefined;

  const { data: unidade, isLoading } = useUnidadesRetrieve(unidadeId ?? 0, {
    query: { enabled: isEdit },
  });
  const { data: blocos } = useBlocosList({ condominio: condominioId });

  const createMutation = useUnidadesCreate();
  const updateMutation = useUnidadesPartialUpdate();
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (unidade) {
      reset({
        nome_unidade: unidade.nome_unidade,
        tipo: unidade.tipo ?? "apartamento",
        numero_moradores: String(unidade.numero_moradores ?? 0),
        fracao_ideal: unidade.fracao_ideal ?? "",
        eh_unidade_sindico: unidade.eh_unidade_sindico ?? false,
        esta_alugada: unidade.esta_alugada ?? false,
        matricula_imovel: unidade.matricula_imovel ?? "",
        valor_gas: unidade.valor_gas ?? "",
        valor_agua: unidade.valor_agua ?? "",
        valor_energia: unidade.valor_energia ?? "",
        bloqueio_lancamentos: unidade.bloqueio_lancamentos ?? false,
        ativo: unidade.ativo ?? true,
        bloco: unidade.bloco ? String(unidade.bloco) : "",
      });
    }
  }, [unidade, reset]);

  const onSubmit = (values: FormValues) => {
    const { bloco, numero_moradores, ...rest } = values;
    const payload = {
      ...cleanPayload(rest),
      condominio: condominioId,
      bloco: bloco ? Number(bloco) : null,
      numero_moradores: toOptionalInt(numero_moradores),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: unidadeId!, data: payload },
        {
          onSuccess: () =>
            router.push(`/condominios/${condominioId}/unidades`),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Unidade },
        {
          onSuccess: (created) =>
            router.push(`/condominios/${condominioId}/unidades/${created.id}`),
        }
      );
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Identificação</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={fieldWrapClass}>
              <label className={labelClass}>Unidade</label>
              <input
                className={inputClass}
                placeholder="Ex.: 101"
                {...register("nome_unidade")}
              />
              {errors.nome_unidade && (
                <span className={errorTextClass}>{errors.nome_unidade.message}</span>
              )}
            </div>

            <div className={fieldWrapClass}>
              <label className={labelClass}>Bloco</label>
              <select className={inputClass} {...register("bloco")}>
                <option value="">— Sem bloco —</option>
                {blocos?.results.map((bloco) => (
                  <option key={bloco.id} value={bloco.id}>
                    {bloco.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className={fieldWrapClass}>
              <label className={labelClass}>Tipo</label>
              <select className={inputClass} {...register("tipo")}>
                <option value="apartamento">Apartamento</option>
                <option value="sala">Sala</option>
                <option value="loja">Loja</option>
                <option value="casa">Casa</option>
                <option value="conjunto">Conjunto</option>
                <option value="box">Box</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div className={fieldWrapClass}>
              <label className={labelClass}>Matrícula do imóvel</label>
              <input className={inputClass} {...register("matricula_imovel")} />
            </div>

            <div className={fieldWrapClass}>
              <label className={labelClass}>Nº de moradores</label>
              <input
                type="number"
                className={inputClass}
                {...register("numero_moradores")}
              />
            </div>

            <div className={fieldWrapClass}>
              <label className={labelClass}>Fração ideal (rateio)</label>
              <input
                className={inputClass}
                inputMode="decimal"
                {...register("fracao_ideal")}
              />
            </div>

            <label className={checkboxLabelClass}>
              <input type="checkbox" {...register("eh_unidade_sindico")} />
              Unidade do síndico
            </label>
            <label className={checkboxLabelClass}>
              <input type="checkbox" {...register("esta_alugada")} />
              Está alugada
            </label>
            <label className={checkboxLabelClass}>
              <input type="checkbox" {...register("bloqueio_lancamentos")} />
              Bloquear lançamentos
            </label>
            <label className={checkboxLabelClass}>
              <input type="checkbox" {...register("ativo")} />
              Ativo
            </label>
          </div>
        </div>

        <div className={sectionClass}>
          <h2 className={sectionTitleClass}>Medidores individuais</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={fieldWrapClass}>
              <label className={labelClass}>Valor gás (R$)</label>
              <input className={inputClass} inputMode="decimal" {...register("valor_gas")} />
            </div>
            <div className={fieldWrapClass}>
              <label className={labelClass}>Valor água (R$)</label>
              <input className={inputClass} inputMode="decimal" {...register("valor_agua")} />
            </div>
            <div className={fieldWrapClass}>
              <label className={labelClass}>Valor energia (R$)</label>
              <input
                className={inputClass}
                inputMode="decimal"
                {...register("valor_energia")}
              />
            </div>
          </div>
        </div>

        {mutation.isError && (
          <p className={errorTextClass}>
            Não foi possível salvar. Confira os campos e tente novamente.
          </p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={mutation.isPending} className={buttonPrimaryClass}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            className={buttonSecondaryClass}
            onClick={() => router.push(`/condominios/${condominioId}/unidades`)}
          >
            Cancelar
          </button>
        </div>
      </form>

      {isEdit && unidade && (
        <PartesSection
          unidadeId={unidade.id}
          partes={unidade.partes}
          onChanged={() =>
            queryClient.invalidateQueries({
              queryKey: getUnidadesRetrieveQueryKey(unidadeId!),
            })
          }
        />
      )}
    </div>
  );
}

interface PartesSectionProps {
  unidadeId: number;
  partes: readonly {
    id: number;
    papel: "proprietario" | "locatario";
    percentual_participacao?: string;
    data_inicio?: string | null;
    data_fim?: string | null;
    pessoa_detalhe: Pessoa;
  }[];
  onChanged: () => void;
}

function PartesSection({ unidadeId, partes, onChanged }: PartesSectionProps) {
  const [pessoa, setPessoa] = useState<Pessoa | null>(null);
  const [papel, setPapel] = useState<"proprietario" | "locatario">("proprietario");
  const [percentual, setPercentual] = useState("");
  const [dataInicio, setDataInicio] = useState("");

  const createMutation = useUnidadePartesCreate();
  const destroyMutation = useUnidadePartesDestroy();

  const handleAdd = () => {
    if (!pessoa) return;
    createMutation.mutate(
      {
        data: {
          unidade: unidadeId,
          pessoa: pessoa.id,
          papel,
          ...(percentual ? { percentual_participacao: percentual } : {}),
          ...(dataInicio ? { data_inicio: dataInicio } : {}),
        },
      },
      {
        onSuccess: () => {
          setPessoa(null);
          setPercentual("");
          setDataInicio("");
          onChanged();
        },
      }
    );
  };

  const handleRemove = (parteId: number) => {
    if (!window.confirm("Remover este vínculo?")) return;
    destroyMutation.mutate({ id: parteId }, { onSuccess: onChanged });
  };

  return (
    <div className={sectionClass}>
      <h2 className={sectionTitleClass}>Proprietários e locatários</h2>

      {partes.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum vínculo cadastrado ainda.</p>
      )}

      {partes.length > 0 && (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {partes.map((parte) => (
            <li key={parte.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {parte.pessoa_detalhe.nome}
                </span>{" "}
                <span className="text-sm text-zinc-500">
                  ({parte.papel === "proprietario" ? "Proprietário" : "Locatário"}
                  {parte.percentual_participacao
                    ? ` — ${parte.percentual_participacao}%`
                    : ""}
                  )
                </span>
              </div>
              <button
                type="button"
                className={buttonDangerClass}
                onClick={() => handleRemove(parte.id)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className={labelClass}>Adicionar vínculo</p>
        {pessoa ? (
          <div className="flex items-center justify-between rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
            <span>
              {pessoa.nome} ({pessoa.cpf_cnpj})
            </span>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline dark:text-red-400"
              onClick={() => setPessoa(null)}
            >
              Trocar
            </button>
          </div>
        ) : (
          <PessoaPicker onSelect={setPessoa} />
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Papel</label>
            <select
              className={inputClass}
              value={papel}
              onChange={(event) =>
                setPapel(event.target.value as "proprietario" | "locatario")
              }
            >
              <option value="proprietario">Proprietário</option>
              <option value="locatario">Locatário</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Percentual (%)</label>
            <input
              className={inputClass}
              inputMode="decimal"
              value={percentual}
              onChange={(event) => setPercentual(event.target.value)}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Início da vigência</label>
            <input
              type="date"
              className={inputClass}
              value={dataInicio}
              onChange={(event) => setDataInicio(event.target.value)}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!pessoa || createMutation.isPending}
          className={buttonPrimaryClass}
          onClick={handleAdd}
        >
          {createMutation.isPending ? "Adicionando..." : "Adicionar vínculo"}
        </button>
      </div>
    </div>
  );
}
