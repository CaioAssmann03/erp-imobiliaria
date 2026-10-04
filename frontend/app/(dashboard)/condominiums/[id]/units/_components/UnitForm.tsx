"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FormField } from "@/components/form/FormField";
import { FieldRow, FormSection } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { PessoaPicker } from "@/components/PessoaPicker";
import { Button } from "@/components/ui/button";
import {
  getDashboardRetrieveQueryKey,
  getUnidadesListQueryKey,
  getUnidadesRetrieveQueryKey,
  useBlocosList,
  useUnidadePartesCreate,
  useUnidadePartesDestroy,
  useUnidadesCreate,
  useUnidadesPartialUpdate,
  useUnidadesRetrieve,
} from "@/lib/api/generated";
import type { Pessoa, Unidade } from "@/lib/api/generated/models";
import { buildPayload } from "@/lib/clean-payload";
import { applyServerErrors } from "@/lib/form-errors";
import { maskDecimal, maskMoney } from "@/lib/masks";
import { dateField, decimalField } from "@/lib/schemas/fields";
import {
  UNIDADE_DEFAULTS,
  UNIDADE_TIPOS,
  unidadeSchema,
  unidadeToForm,
  type UnidadeFormInput,
  type UnidadeFormOutput,
} from "@/lib/schemas/unidade";

const money = (value: string) => maskMoney(value, 8);
const digitsOnly = (value: string) => value.replace(/\D/g, "");

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
  const { data: blocos } = useBlocosList({ condominio: condominioId, limit: 100 });

  const createMutation = useUnidadesCreate();
  const updateMutation = useUnidadesPartialUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<UnidadeFormInput, unknown, UnidadeFormOutput>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: UNIDADE_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  useEffect(() => {
    if (unidade) reset(unidadeToForm(unidade));
  }, [unidade, reset]);

  const invalidate = (id: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getUnidadesListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getUnidadesRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const onSubmit = (values: UnidadeFormOutput) => {
    const payload = {
      ...buildPayload(values, {
        isEdit,
        blankKeys: ["matricula_imovel"],
      }),
      condominio: condominioId,
      bloco: values.bloco,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: unidadeId!, data: payload as Partial<Unidade> },
        {
          onSuccess: () => {
            invalidate(unidadeId!);
            toast.success("Unidade salva.");
            router.push(`/condominios/${condominioId}/unidades`);
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Unidade },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Unidade cadastrada. Agora você pode vincular proprietários e locatários.");
            router.push(`/condominios/${condominioId}/unidades/${created.id}`);
          },
          onError,
        }
      );
    }
  };

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;

  return (
    <div className="space-y-4">
      <FormProvider {...methods}>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit, () => toast.error("Corrija os campos destacados."))}
          className="space-y-4"
        >
          <FormSection title="Identificação">
            <FieldRow columns={3}>
              <TextField
                name="nome_unidade"
                label="Unidade"
                required
                maxLength={30}
                placeholder="Ex.: 101"
                autoComplete="off"
              />
              <SelectField
                name="bloco"
                label="Bloco"
                placeholder="Sem bloco"
                options={(blocos?.results ?? []).map((bloco) => ({
                  value: bloco.id,
                  label: bloco.nome,
                }))}
              />
              <SelectField name="tipo" label="Tipo" options={UNIDADE_TIPOS} />
            </FieldRow>
            <FieldRow columns={3}>
              <TextField name="matricula_imovel" label="Matrícula do imóvel" maxLength={60} />
              <TextField
                name="numero_moradores"
                label="Nº de moradores"
                mask={(value) => digitsOnly(value).slice(0, 3)}
                inputMode="numeric"
              />
              <TextField
                name="fracao_ideal"
                label="Fração ideal"
                mask={(value) => maskDecimal(value, 5, 3)}
                inputMode="decimal"
                placeholder="0,00000"
                hint="Usada no rateio."
              />
            </FieldRow>
            <FieldRow>
              <CheckboxField name="eh_unidade_sindico" label="Unidade do síndico" />
              <CheckboxField name="esta_alugada" label="Está alugada" />
            </FieldRow>
            <FieldRow>
              <CheckboxField name="bloqueio_lancamentos" label="Bloquear lançamentos" />
              <CheckboxField name="ativo" label="Cadastro ativo" />
            </FieldRow>
          </FormSection>

          <FormSection title="Medidores individuais" description="Valores fixos cobrados da unidade.">
            <FieldRow columns={3}>
              <TextField
                name="valor_gas"
                label="Gás (R$)"
                mask={money}
                inputMode="numeric"
                placeholder="0,00"
              />
              <TextField
                name="valor_agua"
                label="Água (R$)"
                mask={money}
                inputMode="numeric"
                placeholder="0,00"
              />
              <TextField
                name="valor_energia"
                label="Energia (R$)"
                mask={money}
                inputMode="numeric"
                placeholder="0,00"
              />
            </FieldRow>
          </FormSection>

          <FormActions isSubmitting={isSubmitting}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/condominios/${condominioId}/unidades`)}
            >
              Cancelar
            </Button>
          </FormActions>
        </form>
      </FormProvider>

      {isEdit && unidade && (
        <PartesSection
          unidadeId={unidade.id}
          partes={unidade.partes}
          onChanged={() => {
            queryClient.invalidateQueries({
              queryKey: getUnidadesRetrieveQueryKey(unidadeId!),
            });
            queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() });
          }}
        />
      )}
    </div>
  );
}

const parteSchema = z.object({
  papel: z.enum(["proprietario", "locatario"], { error: "Selecione o papel" }),
  percentual_participacao: decimalField("Percentual", { max: 100 }),
  data_inicio: dateField("Início da vigência", { min: "1900-01-01", max: "2100-12-31" }),
});
type ParteInput = z.input<typeof parteSchema>;
type ParteOutput = z.output<typeof parteSchema>;

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
  const [pessoaError, setPessoaError] = useState<string>();

  const createMutation = useUnidadePartesCreate();
  const destroyMutation = useUnidadePartesDestroy();

  const methods = useForm<ParteInput, unknown, ParteOutput>({
    resolver: zodResolver(parteSchema),
    defaultValues: { papel: "proprietario", percentual_participacao: "", data_inicio: "" },
    mode: "onTouched",
  });
  const { handleSubmit, reset, setError } = methods;

  const onSubmit = (values: ParteOutput) => {
    if (!pessoa) {
      setPessoaError("Selecione uma pessoa");
      return;
    }
    createMutation.mutate(
      {
        data: {
          unidade: unidadeId,
          pessoa: pessoa.id,
          papel: values.papel,
          ...(values.percentual_participacao
            ? { percentual_participacao: values.percentual_participacao }
            : {}),
          ...(values.data_inicio ? { data_inicio: values.data_inicio } : {}),
        },
      },
      {
        onSuccess: () => {
          setPessoa(null);
          reset();
          toast.success("Vínculo adicionado.");
          onChanged();
        },
        onError: (error) => toast.error(applyServerErrors(error, setError)),
      }
    );
  };

  const handleRemove = (parteId: number) => {
    destroyMutation.mutate(
      { id: parteId },
      {
        onSuccess: () => {
          toast.success("Vínculo removido.");
          onChanged();
        },
        onError: () => toast.error("Não foi possível remover o vínculo."),
      }
    );
  };

  return (
    <FormSection
      title="Proprietários e locatários"
      description="Pessoas vinculadas a esta unidade."
    >
      {partes.length === 0 ? (
        <p className="text-body text-ink-soft">Nenhum vínculo cadastrado ainda.</p>
      ) : (
        <ul className="space-y-1">
          {partes.map((parte) => (
            <li
              key={parte.id}
              className="flex items-center justify-between rounded-panel bg-surface-muted px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{parte.pessoa_detalhe.nome}</div>
                <div className="text-caption text-ink-soft">
                  {parte.papel === "proprietario" ? "Proprietário" : "Locatário"}
                  {parte.percentual_participacao
                    ? ` · ${Number(parte.percentual_participacao).toLocaleString("pt-BR")}%`
                    : ""}
                </div>
              </div>
              <ConfirmDeleteButton
                label="Remover"
                title="Remover vínculo?"
                description={`${parte.pessoa_detalhe.nome} deixará de estar vinculado(a) a esta unidade.`}
                onConfirm={() => handleRemove(parte.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <FormProvider {...methods}>
        <div className="space-y-1 rounded-panel bg-surface-muted p-4">
          <p className="mb-2 text-body font-medium">Adicionar vínculo</p>

          <FormField id="parte-pessoa" label="Pessoa" required error={pessoaError}>
            {pessoa ? (
              <div className="flex h-9 items-center justify-between rounded-control bg-surface px-3 text-body">
                <span className="truncate">
                  {pessoa.nome} · {pessoa.cpf_cnpj}
                </span>
                <button
                  type="button"
                  className="text-caption text-ink-soft hover:text-danger"
                  onClick={() => setPessoa(null)}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <PessoaPicker
                onSelect={(selected) => {
                  setPessoa(selected);
                  setPessoaError(undefined);
                }}
              />
            )}
          </FormField>

          <FieldRow columns={3}>
            <SelectField
              name="papel"
              label="Papel"
              options={[
                { value: "proprietario", label: "Proprietário" },
                { value: "locatario", label: "Locatário" },
              ]}
            />
            <TextField
              name="percentual_participacao"
              label="Participação (%)"
              mask={(value) => maskDecimal(value, 2, 3)}
              inputMode="decimal"
              placeholder="100,00"
            />
            <TextField name="data_inicio" label="Início da vigência" type="date" />
          </FieldRow>

          <Button
            type="button"
            disabled={createMutation.isPending}
            onClick={handleSubmit(onSubmit)}
          >
            {createMutation.isPending ? "Adicionando…" : "Adicionar vínculo"}
          </Button>
        </div>
      </FormProvider>
    </FormSection>
  );
}
