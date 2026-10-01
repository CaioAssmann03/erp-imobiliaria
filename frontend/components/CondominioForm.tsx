"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormField } from "@/components/form/FormField";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { PessoaPicker } from "@/components/PessoaPicker";
import { Button } from "@/components/ui/button";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import {
  getDashboardRetrieveQueryKey,
  getCondominiosListQueryKey,
  getCondominiosRetrieveQueryKey,
  useCondominiosCreate,
  useCondominiosPartialUpdate,
  useCondominiosRetrieve,
  useEmpresasList,
  usePessoasRetrieve,
} from "@/lib/api/generated";
import type { Condominio } from "@/lib/api/generated/models";
import { buildPayload } from "@/lib/clean-payload";
import { applyServerErrors } from "@/lib/form-errors";
import { maskCep, maskCnpj, maskDecimal, maskMoney } from "@/lib/masks";
import {
  CONDOMINIO_DEFAULTS,
  condominioSchema,
  condominioToForm,
  type CondominioFormInput,
  type CondominioFormOutput,
} from "@/lib/schemas/condominio";

const money = (value: string) => maskMoney(value, 10);
const percent = (value: string) => maskDecimal(value, 2, 3);
const digitsOnly = (value: string) => value.replace(/\D/g, "");

interface CondominioFormProps {
  condominioId?: number;
}

export function CondominioForm({ condominioId }: CondominioFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = condominioId !== undefined;

  const { data: condominio, isLoading } = useCondominiosRetrieve(condominioId ?? 0, {
    query: { enabled: isEdit },
  });
  const { data: empresasData } = useEmpresasList({ limit: 100 });
  const empresas = useMemo(() => empresasData?.results ?? [], [empresasData]);

  const createMutation = useCondominiosCreate();
  const updateMutation = useCondominiosPartialUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<CondominioFormInput, unknown, CondominioFormOutput>({
    resolver: zodResolver(condominioSchema),
    defaultValues: CONDOMINIO_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, control, setValue, getValues, setError, clearErrors } = methods;

  const tipoTaxa = useWatch({ control, name: "tipo_taxa_administracao" });
  // CEP digitado pelo usuário (não muda ao carregar/resetar o formulário). Assim a
  // busca dispara assim que o 8º dígito é digitado e nunca sobrescreve endereço salvo.
  const [typedCep, setTypedCep] = useState("");
  const cepLookup = useCepLookup(typedCep);
  const assessorId = useWatch({ control, name: "assessor" });
  const { data: assessorPessoa } = usePessoasRetrieve(assessorId ?? 0, {
    query: { enabled: !!assessorId },
  });

  useEffect(() => {
    if (condominio) reset(condominioToForm(condominio));
  }, [condominio, reset]);

  // Preenche o endereço quando a consulta do CEP digitado responde.
  const cepAddress = cepLookup.data;
  useEffect(() => {
    if (cepAddress === null) {
      setError("cep", { type: "lookup", message: "CEP não encontrado" });
      return;
    }
    if (!cepAddress) return;
    clearErrors("cep");
    const fields = ["logradouro", "bairro", "cidade", "uf"] as const;
    for (const field of fields) {
      // CEPs genéricos não trazem logradouro/bairro: mantém o que o usuário digitou.
      if (cepAddress[field]) {
        setValue(field, cepAddress[field], { shouldDirty: true, shouldValidate: true });
      }
    }
  }, [cepAddress, typedCep, setValue, setError, clearErrors]);

  // Cadastro novo com uma única empresa: já seleciona.
  useEffect(() => {
    if (!isEdit && empresas.length === 1 && !getValues("empresa")) {
      setValue("empresa", String(empresas[0].id));
    }
  }, [isEdit, empresas, getValues, setValue]);

  const invalidate = (id: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getCondominiosListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getCondominiosRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const onSubmit = (values: CondominioFormOutput) => {
    const payload = buildPayload(values, {
      isEdit,
      blankKeys: [
        "cnpj",
        "inscricao_municipal",
        "cep",
        "logradouro",
        "bairro",
        "cidade",
        "uf",
        "hidrometro",
        "relogio_luz",
        "indice_reajuste",
      ],
      nullKeys: [
        "data_inicio_administracao",
        "base_reajuste",
        "percentual_taxa_administracao",
      ],
    });

    if (isEdit) {
      updateMutation.mutate(
        { id: condominioId!, data: payload as Partial<Condominio> },
        {
          onSuccess: () => {
            invalidate(condominioId!);
            toast.success("Condomínio salvo.");
            router.push("/condominios");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Condominio },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Condomínio cadastrado.");
            router.push(`/condominios/${created.id}/unidades`);
          },
          onError,
        }
      );
    }
  };

  if (isEdit && isLoading) return <FormSkeleton sections={3} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <FormSection title="Identificação">
          <FieldRow template="3fr 2fr">
            <TextField name="nome" label="Nome do condomínio" required autoComplete="off" />
            <SelectField
              name="empresa"
              label="Empresa administradora"
              required
              placeholder="Selecione…"
              options={empresas.map((empresa) => ({
                value: empresa.id,
                label: empresa.nome_fantasia || empresa.razao_social,
              }))}
            />
          </FieldRow>
          <FieldRow columns={3}>
            <TextField
              name="cnpj"
              label="CNPJ"
              mask={maskCnpj}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
            />
            <TextField name="inscricao_municipal" label="Inscrição municipal" maxLength={30} />
            <SelectField
              name="tipo"
              label="Tipo"
              options={[
                { value: "residencial", label: "Residencial" },
                { value: "comercial", label: "Comercial" },
              ]}
            />
          </FieldRow>
          <FieldRow>
            <FormField id="assessor" label="Assessor">
              {assessorId ? (
                <div className="flex h-9 items-center justify-between rounded-control bg-surface-muted px-3 text-body">
                  <span className="truncate">{assessorPessoa?.nome ?? "Carregando…"}</span>
                  <button
                    type="button"
                    className="text-caption text-ink-soft hover:text-danger"
                    onClick={() => setValue("assessor", null)}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <PessoaPicker onSelect={(pessoa) => setValue("assessor", pessoa.id)} />
              )}
            </FormField>
            <CheckboxField name="ativo" label="Cadastro ativo" />
          </FieldRow>
        </FormSection>

        <FormSection title="Endereço">
          <FieldRow template="1fr 2fr">
            <TextField
              name="cep"
              label="CEP"
              mask={maskCep}
              onValueChange={setTypedCep}
              inputMode="numeric"
              placeholder="00000-000"
              hint={
                cepLookup.isFetching
                  ? "Buscando endereço…"
                  : cepLookup.isError
                    ? "Não foi possível buscar. Preencha manualmente."
                    : undefined
              }
            />
            <TextField name="logradouro" label="Logradouro" maxLength={255} />
          </FieldRow>
          <FieldRow template="2fr 2fr 1fr">
            <TextField name="bairro" label="Bairro" maxLength={120} />
            <TextField name="cidade" label="Cidade" maxLength={120} />
            <TextField
              name="uf"
              label="UF"
              maxLength={2}
              mask={(value) => value.toUpperCase().replace(/[^A-Z]/g, "")}
              placeholder="SP"
            />
          </FieldRow>
          <FieldRow>
            <TextField name="hidrometro" label="Hidrômetro" maxLength={30} />
            <TextField name="relogio_luz" label="Relógio de luz" maxLength={30} />
          </FieldRow>
        </FormSection>

        <FormSection
          title="Taxa de administração"
          description="Fixa em reais ou variável em percentual."
        >
          <FieldRow>
            <SelectField
              name="tipo_taxa_administracao"
              label="Tipo de taxa"
              options={[
                { value: "fixa", label: "Fixa (valor)" },
                { value: "variavel", label: "Variável (percentual)" },
              ]}
            />
            {tipoTaxa === "fixa" ? (
              <TextField
                name="valor_taxa_administracao"
                label="Valor da taxa (R$)"
                mask={money}
                inputMode="numeric"
                placeholder="0,00"
              />
            ) : (
              <TextField
                name="percentual_taxa_administracao"
                label="Percentual da taxa (%)"
                required
                mask={percent}
                inputMode="decimal"
                placeholder="0,00"
              />
            )}
          </FieldRow>
          <CheckboxField name="cobra_iss_sobre_taxa" label="Cobra ISS sobre a taxa" />
        </FormSection>

        <FormSection title="Cobrança">
          <FieldRow>
            <TextField
              name="dia_vencimento_documento"
              label="Dia de vencimento"
              mask={(value) => digitsOnly(value).slice(0, 2)}
              inputMode="numeric"
              hint="De 1 a 31."
            />
            <SelectField
              name="competencia_calculo"
              label="Competência de cálculo"
              options={[
                { value: "referencia", label: "Referência do cálculo" },
                { value: "posterior", label: "Posterior à referência" },
              ]}
            />
          </FieldRow>
          <CheckboxField name="vencimento_por_dia_util" label="Vencimento por dia útil" />
          <FieldRow columns={3}>
            <TextField
              name="limite_credito"
              label="Limite de crédito (R$)"
              mask={money}
              inputMode="numeric"
              placeholder="0,00"
            />
            <TextField
              name="percentual_desconto_pagamento_dia"
              label="Desconto em dia (%)"
              mask={percent}
              inputMode="decimal"
              placeholder="0,00"
            />
            <TextField
              name="dias_antes_vencimento_desconto"
              label="Dias antes do venc."
              mask={(value) => digitsOnly(value).slice(0, 2)}
              inputMode="numeric"
              hint="Prazo do desconto."
            />
          </FieldRow>
        </FormSection>

        <FormSection title="Reajuste">
          <FieldRow>
            <TextField name="data_inicio_administracao" label="Início da administração" type="date" />
            <TextField name="base_reajuste" label="Base do reajuste" type="date" />
          </FieldRow>
          <FieldRow>
            <TextField
              name="periodicidade_reajuste_meses"
              label="Periodicidade (meses)"
              mask={(value) => digitsOnly(value).slice(0, 3)}
              inputMode="numeric"
            />
            <TextField
              name="indice_reajuste"
              label="Índice de reajuste"
              maxLength={30}
              placeholder="IGPM, INCC…"
            />
          </FieldRow>
        </FormSection>

        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push("/condominios")}>
            Cancelar
          </Button>
          {isEdit && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/condominios/${condominioId}/unidades`)}
            >
              Ver unidades
            </Button>
          )}
        </FormActions>
      </form>
    </FormProvider>
  );
}
