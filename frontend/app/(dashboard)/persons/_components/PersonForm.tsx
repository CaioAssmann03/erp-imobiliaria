"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CheckboxField, SelectField, TextField } from "@/components/form/fields";
import { FormActions } from "@/components/form/FormActions";
import { FormSection, FieldRow } from "@/components/form/FormSection";
import { FormSkeleton } from "@/components/form/FormSkeleton";
import { Button } from "@/components/ui/button";
import {
  getDashboardRetrieveQueryKey,
  getPessoasListQueryKey,
  getPessoasRetrieveQueryKey,
  usePessoasCreate,
  usePessoasPartialUpdate,
  usePessoasRetrieve,
} from "@/lib/api/generated";
import type { Pessoa } from "@/lib/api/generated/models";
import { buildPayload } from "@/lib/clean-payload";
import { applyServerErrors } from "@/lib/form-errors";
import { maskCnpj, maskCpf, maskPhone } from "@/lib/masks";
import {
  PESSOA_DEFAULTS,
  pessoaSchema,
  pessoaToForm,
  type PessoaFormInput,
  type PessoaFormOutput,
} from "@/lib/schemas/pessoa";

const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União estável"];

interface PessoaFormProps {
  pessoaId?: number;
}

export function PessoaForm({ pessoaId }: PessoaFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = pessoaId !== undefined;

  const { data: pessoa, isLoading } = usePessoasRetrieve(pessoaId ?? 0, {
    query: { enabled: isEdit },
  });
  const createMutation = usePessoasCreate();
  const updateMutation = usePessoasPartialUpdate();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<PessoaFormInput, unknown, PessoaFormOutput>({
    resolver: zodResolver(pessoaSchema),
    defaultValues: PESSOA_DEFAULTS,
    mode: "onTouched",
  });
  const { handleSubmit, reset, control, getValues, setValue, setError } = methods;

  const tipo = useWatch({ control, name: "tipo_pessoa" });
  const isFisica = tipo === "fisica";

  useEffect(() => {
    if (pessoa) reset(pessoaToForm(pessoa));
  }, [pessoa, reset]);

  // Ao trocar entre física/jurídica, reaplica a máscara do documento.
  useEffect(() => {
    const current = getValues("cpf_cnpj");
    if (current) setValue("cpf_cnpj", isFisica ? maskCpf(current) : maskCnpj(current));
  }, [isFisica, getValues, setValue]);

  const invalidate = (id: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getPessoasListQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getDashboardRetrieveQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getPessoasRetrieveQueryKey(id) }),
    ]);

  const onError = (error: unknown) => toast.error(applyServerErrors(error, setError));

  const onSubmit = (values: PessoaFormOutput) => {
    const payload = buildPayload(values, {
      isEdit,
      blankKeys: [
        "rg_ie",
        "estado_civil",
        "profissao",
        "telefone_residencial",
        "telefone_comercial",
        "celular",
        "email",
      ],
      nullKeys: ["data_nascimento"],
    });

    if (isEdit) {
      updateMutation.mutate(
        { id: pessoaId!, data: payload as Partial<Pessoa> },
        {
          onSuccess: () => {
            invalidate(pessoaId!);
            toast.success("Pessoa salva.");
            router.push("/pessoas");
          },
          onError,
        }
      );
    } else {
      createMutation.mutate(
        { data: payload as unknown as Pessoa },
        {
          onSuccess: (created) => {
            invalidate(created.id);
            toast.success("Pessoa cadastrada.");
            router.push("/pessoas");
          },
          onError,
        }
      );
    }
  };

  if (isEdit && isLoading) return <FormSkeleton sections={2} />;

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit, () => toast.error("Corrija os campos destacados."))}
        className="space-y-4"
      >
        <FormSection title="Identificação">
          <FieldRow template="2fr 1fr">
            <TextField
              name="nome"
              label={isFisica ? "Nome completo" : "Razão social"}
              required
              autoComplete="off"
            />
            <SelectField
              name="tipo_pessoa"
              label="Tipo de pessoa"
              options={[
                { value: "fisica", label: "Pessoa física" },
                { value: "juridica", label: "Pessoa jurídica" },
              ]}
            />
          </FieldRow>
          <FieldRow columns={3}>
            <TextField
              name="cpf_cnpj"
              label={isFisica ? "CPF" : "CNPJ"}
              required
              mask={isFisica ? maskCpf : maskCnpj}
              inputMode="numeric"
              placeholder={isFisica ? "000.000.000-00" : "00.000.000/0000-00"}
            />
            <TextField
              name="rg_ie"
              label={isFisica ? "RG" : "Inscrição estadual"}
              maxLength={20}
            />
            <CheckboxField name="ativo" label="Cadastro ativo" />
          </FieldRow>
          {isFisica && (
            <FieldRow columns={3}>
              <TextField name="data_nascimento" label="Data de nascimento" type="date" />
              <TextField
                name="estado_civil"
                label="Estado civil"
                suggestions={ESTADOS_CIVIS}
                maxLength={30}
              />
              <TextField name="profissao" label="Profissão" maxLength={120} />
            </FieldRow>
          )}
        </FormSection>

        <FormSection title="Contato" description="Informe ao menos uma forma de contato quando possível.">
          <TextField
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="nome@dominio.com"
          />
          <FieldRow columns={3}>
            <TextField
              name="celular"
              label="Celular"
              mask={maskPhone}
              inputMode="tel"
              placeholder="(00) 00000-0000"
            />
            <TextField
              name="telefone_residencial"
              label="Residencial"
              mask={maskPhone}
              inputMode="tel"
              placeholder="(00) 0000-0000"
            />
            <TextField
              name="telefone_comercial"
              label="Comercial"
              mask={maskPhone}
              inputMode="tel"
              placeholder="(00) 0000-0000"
            />
          </FieldRow>
        </FormSection>

        <FormActions isSubmitting={isSubmitting}>
          <Button type="button" variant="secondary" onClick={() => router.push("/pessoas")}>
            Cancelar
          </Button>
        </FormActions>
      </form>
    </FormProvider>
  );
}
