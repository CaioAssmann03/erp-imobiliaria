"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  useCondominiosCreate,
  useCondominiosPartialUpdate,
  useCondominiosRetrieve,
  useEmpresasList,
  usePessoasRetrieve,
} from "@/lib/api/generated";
import type { Condominio } from "@/lib/api/generated/models";
import { cleanPayload, toOptionalInt } from "@/lib/clean-payload";
import {
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
  nome: z.string().min(1, "Informe o nome"),
  cnpj: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  empresa: z.string().min(1, "Selecione a empresa"),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  hidrometro: z.string().optional(),
  relogio_luz: z.string().optional(),
  tipo: z.enum(["residencial", "comercial"]),
  data_inicio_administracao: z.string().optional(),
  base_reajuste: z.string().optional(),
  periodicidade_reajuste_meses: z.string().optional(),
  indice_reajuste: z.string().optional(),
  tipo_taxa_administracao: z.enum(["fixa", "variavel"]),
  valor_taxa_administracao: z.string().optional(),
  percentual_taxa_administracao: z.string().optional(),
  cobra_iss_sobre_taxa: z.boolean(),
  dia_vencimento_documento: z.string().optional(),
  vencimento_por_dia_util: z.boolean(),
  competencia_calculo: z.enum(["referencia", "posterior"]),
  percentual_desconto_pagamento_dia: z.string().optional(),
  dias_antes_vencimento_desconto: z.string().optional(),
  limite_credito: z.string().optional(),
  ativo: z.boolean(),
  assessor: z.number().nullable(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  nome: "",
  cnpj: "",
  inscricao_municipal: "",
  empresa: "",
  cep: "",
  logradouro: "",
  bairro: "",
  cidade: "",
  uf: "",
  hidrometro: "",
  relogio_luz: "",
  tipo: "residencial",
  data_inicio_administracao: "",
  base_reajuste: "",
  periodicidade_reajuste_meses: "12",
  indice_reajuste: "",
  tipo_taxa_administracao: "fixa",
  valor_taxa_administracao: "",
  percentual_taxa_administracao: "",
  cobra_iss_sobre_taxa: false,
  dia_vencimento_documento: "10",
  vencimento_por_dia_util: false,
  competencia_calculo: "referencia",
  percentual_desconto_pagamento_dia: "",
  dias_antes_vencimento_desconto: "0",
  limite_credito: "",
  ativo: true,
  assessor: null,
};

interface CondominioFormProps {
  condominioId?: number;
}

export function CondominioForm({ condominioId }: CondominioFormProps) {
  const router = useRouter();
  const isEdit = condominioId !== undefined;

  const { data: condominio, isLoading } = useCondominiosRetrieve(condominioId ?? 0, {
    query: { enabled: isEdit },
  });
  const { data: empresasData } = useEmpresasList({});

  const createMutation = useCondominiosCreate();
  const updateMutation = useCondominiosPartialUpdate();
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const assessorId = useWatch({ control, name: "assessor" });
  const { data: assessorPessoa } = usePessoasRetrieve(assessorId ?? 0, {
    query: { enabled: !!assessorId },
  });

  useEffect(() => {
    if (condominio) {
      reset({
        nome: condominio.nome,
        cnpj: condominio.cnpj ?? "",
        inscricao_municipal: condominio.inscricao_municipal ?? "",
        empresa: String(condominio.empresa),
        cep: condominio.cep ?? "",
        logradouro: condominio.logradouro ?? "",
        bairro: condominio.bairro ?? "",
        cidade: condominio.cidade ?? "",
        uf: condominio.uf ?? "",
        hidrometro: condominio.hidrometro ?? "",
        relogio_luz: condominio.relogio_luz ?? "",
        tipo: condominio.tipo ?? "residencial",
        data_inicio_administracao: condominio.data_inicio_administracao ?? "",
        base_reajuste: condominio.base_reajuste ?? "",
        periodicidade_reajuste_meses: String(
          condominio.periodicidade_reajuste_meses ?? 12
        ),
        indice_reajuste: condominio.indice_reajuste ?? "",
        tipo_taxa_administracao: condominio.tipo_taxa_administracao ?? "fixa",
        valor_taxa_administracao: condominio.valor_taxa_administracao ?? "",
        percentual_taxa_administracao: condominio.percentual_taxa_administracao ?? "",
        cobra_iss_sobre_taxa: condominio.cobra_iss_sobre_taxa ?? false,
        dia_vencimento_documento: String(
          condominio.dia_vencimento_documento ?? 10
        ),
        vencimento_por_dia_util: condominio.vencimento_por_dia_util ?? false,
        competencia_calculo: condominio.competencia_calculo ?? "referencia",
        percentual_desconto_pagamento_dia:
          condominio.percentual_desconto_pagamento_dia ?? "",
        dias_antes_vencimento_desconto: String(
          condominio.dias_antes_vencimento_desconto ?? 0
        ),
        limite_credito: condominio.limite_credito ?? "",
        ativo: condominio.ativo ?? true,
        assessor: condominio.assessor ?? null,
      });
    }
  }, [condominio, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...cleanPayload(values),
      empresa: Number(values.empresa),
      periodicidade_reajuste_meses: toOptionalInt(values.periodicidade_reajuste_meses),
      dia_vencimento_documento: toOptionalInt(values.dia_vencimento_documento),
      dias_antes_vencimento_desconto: toOptionalInt(
        values.dias_antes_vencimento_desconto
      ),
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: condominioId!, data: payload },
        { onSuccess: () => router.push("/condominios") }
      );
    } else {
      createMutation.mutate(
        {
          data: payload as unknown as Condominio,
        },
        { onSuccess: (created) => router.push(`/condominios/${created.id}`) }
      );
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Identificação</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} {...register("nome")} />
            {errors.nome && (
              <span className={errorTextClass}>{errors.nome.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Empresa administradora</label>
            <select className={inputClass} {...register("empresa")}>
              <option value="" disabled>
                Selecione...
              </option>
              {empresasData?.results.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome_fantasia || empresa.razao_social}
                </option>
              ))}
            </select>
            {errors.empresa && (
              <span className={errorTextClass}>{errors.empresa.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>CNPJ</label>
            <input className={inputClass} {...register("cnpj")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Inscrição municipal</label>
            <input className={inputClass} {...register("inscricao_municipal")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Tipo</label>
            <select className={inputClass} {...register("tipo")}>
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
            </select>
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Assessor</label>
            {assessorId ? (
              <div className="flex items-center justify-between rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
                <span>{assessorPessoa?.nome ?? "Carregando..."}</span>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                  onClick={() => setValue("assessor", null)}
                >
                  Remover
                </button>
              </div>
            ) : (
              <PessoaPicker
                onSelect={(pessoa) => setValue("assessor", pessoa.id)}
              />
            )}
          </div>

          <label className={`${checkboxLabelClass} self-end pb-1.5`}>
            <input type="checkbox" {...register("ativo")} />
            Ativo
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Endereço</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>CEP</label>
            <input className={inputClass} {...register("cep")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Logradouro</label>
            <input className={inputClass} {...register("logradouro")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Bairro</label>
            <input className={inputClass} {...register("bairro")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Cidade</label>
            <input className={inputClass} {...register("cidade")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>UF</label>
            <input className={inputClass} maxLength={2} {...register("uf")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Hidrômetro</label>
            <input className={inputClass} {...register("hidrometro")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Relógio de luz</label>
            <input className={inputClass} {...register("relogio_luz")} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Taxa de administração</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Tipo de taxa</label>
            <select className={inputClass} {...register("tipo_taxa_administracao")}>
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Valor da taxa (R$)</label>
            <input
              className={inputClass}
              inputMode="decimal"
              {...register("valor_taxa_administracao")}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Percentual da taxa (%)</label>
            <input
              className={inputClass}
              inputMode="decimal"
              {...register("percentual_taxa_administracao")}
            />
          </div>
          <label className={`${checkboxLabelClass} self-end pb-1.5`}>
            <input type="checkbox" {...register("cobra_iss_sobre_taxa")} />
            Cobra ISS sobre a taxa
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Cobrança</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Dia de vencimento do documento</label>
            <input
              type="number"
              className={inputClass}
              {...register("dia_vencimento_documento")}
            />
          </div>
          <label className={`${checkboxLabelClass} self-end pb-1.5`}>
            <input type="checkbox" {...register("vencimento_por_dia_util")} />
            Vencimento por dia útil
          </label>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Competência de cálculo</label>
            <select className={inputClass} {...register("competencia_calculo")}>
              <option value="referencia">Referência do cálculo</option>
              <option value="posterior">Posterior à referência</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Limite de crédito (R$)</label>
            <input
              className={inputClass}
              inputMode="decimal"
              {...register("limite_credito")}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Desconto por pagamento em dia (%)</label>
            <input
              className={inputClass}
              inputMode="decimal"
              {...register("percentual_desconto_pagamento_dia")}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Dias antes do vencimento p/ desconto</label>
            <input
              type="number"
              className={inputClass}
              {...register("dias_antes_vencimento_desconto")}
            />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Reajuste</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Início da administração</label>
            <input
              type="date"
              className={inputClass}
              {...register("data_inicio_administracao")}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Base do reajuste</label>
            <input type="date" className={inputClass} {...register("base_reajuste")} />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Periodicidade do reajuste (meses)</label>
            <input
              type="number"
              className={inputClass}
              {...register("periodicidade_reajuste_meses")}
            />
          </div>
          <div className={fieldWrapClass}>
            <label className={labelClass}>Índice de reajuste</label>
            <input
              className={inputClass}
              placeholder="Ex.: IGPM, INCC"
              {...register("indice_reajuste")}
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
          onClick={() => router.push("/condominios")}
        >
          Cancelar
        </button>
        {isEdit && (
          <button
            type="button"
            className={buttonSecondaryClass}
            onClick={() => router.push(`/condominios/${condominioId}/unidades`)}
          >
            Ver unidades
          </button>
        )}
      </div>
    </form>
  );
}
