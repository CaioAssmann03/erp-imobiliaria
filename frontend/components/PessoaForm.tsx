"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  usePessoasCreate,
  usePessoasPartialUpdate,
  usePessoasRetrieve,
} from "@/lib/api/generated";
import { cleanPayload } from "@/lib/clean-payload";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  checkboxLabelClass,
  errorTextClass,
  fieldWrapClass,
  inputClass,
  labelClass,
  sectionClass,
} from "@/lib/ui";

const schema = z.object({
  tipo_pessoa: z.enum(["fisica", "juridica"]),
  nome: z.string().min(1, "Informe o nome"),
  cpf_cnpj: z.string().min(1, "Informe o CPF/CNPJ"),
  rg_ie: z.string().optional(),
  data_nascimento: z.string().optional(),
  estado_civil: z.string().optional(),
  profissao: z.string().optional(),
  telefone_residencial: z.string().optional(),
  telefone_comercial: z.string().optional(),
  celular: z.string().optional(),
  email: z.union([z.literal(""), z.string().email("Email inválido")]).optional(),
  ativo: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  tipo_pessoa: "fisica",
  nome: "",
  cpf_cnpj: "",
  rg_ie: "",
  data_nascimento: "",
  estado_civil: "",
  profissao: "",
  telefone_residencial: "",
  telefone_comercial: "",
  celular: "",
  email: "",
  ativo: true,
};

interface PessoaFormProps {
  pessoaId?: number;
}

export function PessoaForm({ pessoaId }: PessoaFormProps) {
  const router = useRouter();
  const isEdit = pessoaId !== undefined;

  const { data: pessoa, isLoading } = usePessoasRetrieve(pessoaId ?? 0, {
    query: { enabled: isEdit },
  });

  const createMutation = usePessoasCreate();
  const updateMutation = usePessoasPartialUpdate();

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
    if (pessoa) {
      reset({
        tipo_pessoa: pessoa.tipo_pessoa ?? "fisica",
        nome: pessoa.nome,
        cpf_cnpj: pessoa.cpf_cnpj,
        rg_ie: pessoa.rg_ie ?? "",
        data_nascimento: pessoa.data_nascimento ?? "",
        estado_civil: pessoa.estado_civil ?? "",
        profissao: pessoa.profissao ?? "",
        telefone_residencial: pessoa.telefone_residencial ?? "",
        telefone_comercial: pessoa.telefone_comercial ?? "",
        celular: pessoa.celular ?? "",
        email: pessoa.email ?? "",
        ativo: pessoa.ativo ?? true,
      });
    }
  }, [pessoa, reset]);

  const mutation = isEdit ? updateMutation : createMutation;

  const onSubmit = (values: FormValues) => {
    const payload = cleanPayload(values);

    if (isEdit) {
      updateMutation.mutate(
        { id: pessoaId!, data: payload },
        { onSuccess: () => router.push("/pessoas") }
      );
    } else {
      createMutation.mutate(
        { data: payload as FormValues & { nome: string; cpf_cnpj: string } },
        {
          onSuccess: (created) => router.push(`/pessoas/${created.id}`),
        }
      );
    }
  };

  if (isEdit && isLoading) {
    return <p className="text-sm text-zinc-500">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className={sectionClass}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Tipo de pessoa</label>
            <select className={inputClass} {...register("tipo_pessoa")}>
              <option value="fisica">Física</option>
              <option value="juridica">Jurídica</option>
            </select>
          </div>

          <label className={`${checkboxLabelClass} self-end pb-1.5`}>
            <input type="checkbox" {...register("ativo")} />
            Ativo
          </label>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Nome</label>
            <input className={inputClass} {...register("nome")} />
            {errors.nome && (
              <span className={errorTextClass}>{errors.nome.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>CPF/CNPJ</label>
            <input className={inputClass} {...register("cpf_cnpj")} />
            {errors.cpf_cnpj && (
              <span className={errorTextClass}>{errors.cpf_cnpj.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>RG/Inscrição Estadual</label>
            <input className={inputClass} {...register("rg_ie")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Data de nascimento</label>
            <input type="date" className={inputClass} {...register("data_nascimento")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Estado civil</label>
            <input className={inputClass} {...register("estado_civil")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Profissão</label>
            <input className={inputClass} {...register("profissao")} />
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <label className={labelClass}>Celular</label>
            <input className={inputClass} {...register("celular")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} {...register("email")} />
            {errors.email && (
              <span className={errorTextClass}>{errors.email.message}</span>
            )}
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Telefone residencial</label>
            <input className={inputClass} {...register("telefone_residencial")} />
          </div>

          <div className={fieldWrapClass}>
            <label className={labelClass}>Telefone comercial</label>
            <input className={inputClass} {...register("telefone_comercial")} />
          </div>
        </div>
      </div>

      {mutation.isError && (
        <p className={errorTextClass}>
          Não foi possível salvar. Confira os campos e tente novamente.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className={buttonPrimaryClass}
        >
          {mutation.isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          className={buttonSecondaryClass}
          onClick={() => router.push("/pessoas")}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
