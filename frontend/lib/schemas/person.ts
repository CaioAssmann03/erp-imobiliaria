import { z } from "zod";

import type { Pessoa } from "@/lib/api/generated/models";
import { maskCpfCnpj, maskPhone, onlyDigits } from "@/lib/masks";
import { isValidCnpj, isValidCpf } from "@/lib/validators";

import {
  dateField,
  emailField,
  enumField,
  optionalText,
  phoneField,
  requiredText,
} from "./fields";

type DocumentInput = { tipo_pessoa: string; cpf_cnpj: string };

function documentError(values: DocumentInput): string | null {
  const digits = onlyDigits(values.cpf_cnpj ?? "");
  const isCpf = values.tipo_pessoa === "fisica";
  const label = isCpf ? "CPF" : "CNPJ";
  if (!digits) return `Informe o ${label}`;
  if (isCpf ? !isValidCpf(digits) : !isValidCnpj(digits)) {
    return `${label} inválido. Confira os dígitos`;
  }
  return null;
}

export const pessoaSchema = z
  .object({
    tipo_pessoa: enumField(["fisica", "juridica"]),
    nome: requiredText("o nome", { min: 2, max: 255 }),
    cpf_cnpj: z.string(),
    rg_ie: optionalText("RG/Inscrição estadual", 20),
    data_nascimento: dateField("Data de nascimento", { min: "1900-01-01", max: "today" }),
    estado_civil: optionalText("Estado civil", 30),
    profissao: optionalText("Profissão", 120),
    telefone_residencial: phoneField,
    telefone_comercial: phoneField,
    celular: phoneField,
    email: emailField,
    ativo: z.boolean(),
  })
  // `when: () => true`: valida o documento mesmo que outros campos já tenham falhado,
  // para o usuário ver todos os erros de uma vez.
  .refine((values) => documentError(values) === null, {
    path: ["cpf_cnpj"],
    when: () => true,
    error: (issue) => documentError(issue.input as DocumentInput) ?? "Documento inválido",
  })
  .transform((values) => ({ ...values, cpf_cnpj: maskCpfCnpj(values.cpf_cnpj) }));

export type PessoaFormInput = z.input<typeof pessoaSchema>;
export type PessoaFormOutput = z.output<typeof pessoaSchema>;

export const PESSOA_DEFAULTS: PessoaFormInput = {
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

export function pessoaToForm(pessoa: Pessoa): PessoaFormInput {
  return {
    tipo_pessoa: pessoa.tipo_pessoa ?? "fisica",
    nome: pessoa.nome,
    cpf_cnpj: maskCpfCnpj(pessoa.cpf_cnpj),
    rg_ie: pessoa.rg_ie ?? "",
    data_nascimento: pessoa.data_nascimento ?? "",
    estado_civil: pessoa.estado_civil ?? "",
    profissao: pessoa.profissao ?? "",
    telefone_residencial: maskPhone(pessoa.telefone_residencial ?? ""),
    telefone_comercial: maskPhone(pessoa.telefone_comercial ?? ""),
    celular: maskPhone(pessoa.celular ?? ""),
    email: pessoa.email ?? "",
    ativo: pessoa.ativo ?? true,
  };
}
