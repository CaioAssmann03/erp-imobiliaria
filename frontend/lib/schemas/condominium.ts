import { z } from "zod";

import type { Condominio } from "@/lib/api/generated/models";
import { decimalFromApi, maskCep, maskCnpj, moneyFromApi } from "@/lib/masks";
import { isValidCnpj } from "@/lib/validators";

import {
  cepField,
  dateField,
  decimalField,
  enumField,
  intField,
  optionalText,
  requiredText,
  ufField,
} from "./fields";

const MAX_MONEY = 99_999_999.99; // numeric(10, 2)

const cnpjField = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .refine((value) => value === "" || isValidCnpj(value), "CNPJ inválido. Confira os dígitos")
  )
  .transform((value) => (value ? maskCnpj(value) : undefined));

type TaxaInput = {
  tipo_taxa_administracao: string;
  percentual_taxa_administracao?: string;
};

/** Taxa variável exige percentual maior que zero. */
function taxaError(values: TaxaInput): string | null {
  if (values.tipo_taxa_administracao !== "variavel") return null;
  if (values.percentual_taxa_administracao === undefined) {
    return "Informe o percentual da taxa variável";
  }
  if (Number(values.percentual_taxa_administracao) === 0) {
    return "O percentual deve ser maior que zero";
  }
  return null;
}

export const condominioSchema = z
  .object({
    nome: requiredText("o nome", { min: 2, max: 255 }),
    empresa: z.string().min(1, "Selecione a empresa administradora").transform(Number),
    cnpj: cnpjField,
    inscricao_municipal: optionalText("Inscrição municipal", 30),
    tipo: enumField(["residencial", "comercial"]),
    assessor: z.number().nullable(),
    ativo: z.boolean(),

    cep: cepField,
    logradouro: optionalText("Logradouro", 255),
    bairro: optionalText("Bairro", 120),
    cidade: optionalText("Cidade", 120),
    uf: ufField,
    hidrometro: optionalText("Hidrômetro", 30),
    relogio_luz: optionalText("Relógio de luz", 30),

    tipo_taxa_administracao: enumField(["fixa", "variavel"]),
    valor_taxa_administracao: decimalField("Valor da taxa", { max: MAX_MONEY }),
    percentual_taxa_administracao: decimalField("Percentual da taxa", { max: 100 }),
    cobra_iss_sobre_taxa: z.boolean(),

    dia_vencimento_documento: intField("Dia de vencimento", 1, 31),
    vencimento_por_dia_util: z.boolean(),
    competencia_calculo: enumField(["referencia", "posterior"]),
    limite_credito: decimalField("Limite de crédito", { max: MAX_MONEY }),
    percentual_desconto_pagamento_dia: decimalField("Desconto", { max: 100 }),
    dias_antes_vencimento_desconto: intField("Dias antes do vencimento", 0, 31),

    data_inicio_administracao: dateField("Data de início", { min: "1900-01-01", max: "2100-12-31" }),
    base_reajuste: dateField("Base do reajuste", { min: "1900-01-01", max: "2100-12-31" }),
    periodicidade_reajuste_meses: intField("Periodicidade", 1, 120),
    indice_reajuste: optionalText("Índice de reajuste", 30).transform((value) =>
      value?.toUpperCase()
    ),
  })
  .refine((values) => taxaError(values) === null, {
    path: ["percentual_taxa_administracao"],
    when: () => true,
    error: (issue) => taxaError(issue.input as TaxaInput) ?? "Percentual inválido",
  });

export type CondominioFormInput = z.input<typeof condominioSchema>;
export type CondominioFormOutput = z.output<typeof condominioSchema>;

export const CONDOMINIO_DEFAULTS: CondominioFormInput = {
  nome: "",
  empresa: "",
  cnpj: "",
  inscricao_municipal: "",
  tipo: "residencial",
  assessor: null,
  ativo: true,
  cep: "",
  logradouro: "",
  bairro: "",
  cidade: "",
  uf: "",
  hidrometro: "",
  relogio_luz: "",
  tipo_taxa_administracao: "fixa",
  valor_taxa_administracao: "",
  percentual_taxa_administracao: "",
  cobra_iss_sobre_taxa: false,
  dia_vencimento_documento: "10",
  vencimento_por_dia_util: false,
  competencia_calculo: "referencia",
  limite_credito: "",
  percentual_desconto_pagamento_dia: "",
  dias_antes_vencimento_desconto: "0",
  data_inicio_administracao: "",
  base_reajuste: "",
  periodicidade_reajuste_meses: "12",
  indice_reajuste: "",
};

export function condominioToForm(c: Condominio): CondominioFormInput {
  return {
    nome: c.nome,
    empresa: String(c.empresa),
    cnpj: c.cnpj ? maskCnpj(c.cnpj) : "",
    inscricao_municipal: c.inscricao_municipal ?? "",
    tipo: c.tipo ?? "residencial",
    assessor: c.assessor ?? null,
    ativo: c.ativo ?? true,
    cep: c.cep ? maskCep(c.cep) : "",
    logradouro: c.logradouro ?? "",
    bairro: c.bairro ?? "",
    cidade: c.cidade ?? "",
    uf: c.uf ?? "",
    hidrometro: c.hidrometro ?? "",
    relogio_luz: c.relogio_luz ?? "",
    tipo_taxa_administracao: c.tipo_taxa_administracao ?? "fixa",
    valor_taxa_administracao: moneyFromApi(c.valor_taxa_administracao),
    percentual_taxa_administracao: decimalFromApi(c.percentual_taxa_administracao, 2),
    cobra_iss_sobre_taxa: c.cobra_iss_sobre_taxa ?? false,
    dia_vencimento_documento: String(c.dia_vencimento_documento ?? 10),
    vencimento_por_dia_util: c.vencimento_por_dia_util ?? false,
    competencia_calculo: c.competencia_calculo ?? "referencia",
    limite_credito: moneyFromApi(c.limite_credito),
    percentual_desconto_pagamento_dia: decimalFromApi(c.percentual_desconto_pagamento_dia, 2),
    dias_antes_vencimento_desconto: String(c.dias_antes_vencimento_desconto ?? 0),
    data_inicio_administracao: c.data_inicio_administracao ?? "",
    base_reajuste: c.base_reajuste ?? "",
    periodicidade_reajuste_meses: String(c.periodicidade_reajuste_meses ?? 12),
    indice_reajuste: c.indice_reajuste ?? "",
  };
}

