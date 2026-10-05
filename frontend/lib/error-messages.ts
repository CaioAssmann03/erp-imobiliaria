import type { ErrorCodeEnum } from "@/lib/api/generated/models";

/**
 * Mensagens em português de cada código de erro da API (spec 006).
 *
 * O tipo `Record<ErrorCodeEnum, string>` vem do schema gerado: um código novo no backend
 * sem tradução aqui quebra a compilação. A mensagem em inglês da API é só o plano B.
 */
export const ERROR_MESSAGES: Record<ErrorCodeEnum, string> = {
  "account_payable.amount.not_positive": "O valor deve ser maior que zero.",
  "account_payable.amount_paid.not_positive": "O valor pago deve ser maior que zero.",
  "account_payable.condominium.other_company": "O condomínio pertence a outra empresa.",
  "account_payable.cost_center.not_allowed_for_company_expense": "Despesa da empresa não tem centro de custo.",
  "account_payable.cost_center.other_condominium": "O centro de custo pertence a outro condomínio.",
  "account_payable.cost_center.required_for_condominium": "A despesa de um condomínio precisa de um centro de custo.",
  "account_payable.deletion.is_paid": "Uma conta a pagar paga não pode ser excluída.",
  "account_payable.due_date.before_issue_date": "O vencimento não pode ser anterior à emissão.",
  "account_payable.payment.not_allowed_unless_paid": "Só uma conta paga tem dados de pagamento.",
  "account_payable.payment.required_when_paid": "Uma conta paga precisa de data, valor e forma de pagamento.",
  "account_payable.status.not_open": "Só uma conta a pagar em aberto pode ser alterada, baixada ou cancelada.",
  "account_payable.supplier.other_company": "O fornecedor pertence a outra empresa.",
  "amount.not_positive": "O valor deve ser maior que zero.",
  "administration_contract.fee_amount.required_for_fixed": "Informe o valor da taxa fixa.",
  "administration_contract.fee_floor.exceeds_ceiling": "O piso não pode ser maior que o teto.",
  "administration_contract.variable_fee.requires_percentage_and_basis":
    "A taxa variável exige percentual e base de cálculo.",
  authentication_failed: "Falha na autenticação.",
  bad_authorization_header: "Cabeçalho de autorização inválido.",
  bad_gateway: "Servidor indisponível no momento. Tente novamente em instantes.",
  "bank_account.account_number.duplicate_for_holder":
    "Este titular já tem uma conta com este banco, agência e número.",
  "bank_account.condominium.other_company": "O condomínio pertence a outra empresa.",
  "bank_code.invalid_format": "O código do banco deve ter exatamente 3 dígitos.",
  "billing_rules.due_day.out_of_range": "O dia de vencimento deve ficar entre 1 e 28.",
  "billing_rules.early_payment_discount_percentage.out_of_range":
    "O desconto deve ficar entre 0 e 100.",
  blank: "Campo obrigatório.",
  "block.name.duplicate_in_condominium": "Já existe um bloco com este nome neste condomínio.",
  "cnpj.invalid_check_digits": "CNPJ inválido.",
  "cnpj.invalid_length": "O CNPJ deve ter 14 caracteres, sem pontuação.",
  "condominium.advisor.other_company": "O assessor pertence a outra empresa.",
  "cost_center.condominium.immutable": "O condomínio de um centro de custo não pode ser alterado.",
  "cost_center.deletion.has_entry_templates":
    "Este centro de custo tem modelos de lançamento; desative-o em vez de excluir.",
  "cost_center.name.duplicate_in_condominium":
    "Já existe um centro de custo com este nome neste condomínio.",
  "cpf.invalid_check_digits": "CPF inválido.",
  "cpf.invalid_length": "O CPF deve ter 11 dígitos, sem pontuação.",
  does_not_exist: "Seleção inválida.",
  "due_day.out_of_range": "O dia de vencimento deve ficar entre 1 e 28.",
  empty: "Campo obrigatório.",
  "entry_template.admin_fee_incidence_percentage.out_of_range":
    "O percentual deve ficar entre 0 e 100.",
  "entry_template.name.duplicate_in_cost_center":
    "Já existe um modelo de lançamento com este nome neste centro de custo.",
  "entry_template.cost_center.immutable":
    "O centro de custo de um modelo de lançamento não pode ser alterado.",
  "ideal_fraction.out_of_range": "A fração ideal deve ser maior que 0 e no máximo 1.",
  incorrect_type: "Valor em formato inválido.",
  invalid: "Valor inválido.",
  invalid_choice: "Opção inválida.",
  max_decimal_places: "Casas decimais demais.",
  max_digits: "Número com dígitos demais.",
  max_length: "Texto muito longo.",
  max_value: "Valor acima do permitido.",
  max_whole_digits: "Número com dígitos demais.",
  method_not_allowed: "Operação não permitida.",
  min_length: "Texto muito curto.",
  min_value: "Valor abaixo do permitido.",
  no_active_account: "Usuário ou senha inválidos.",
  not_a_list: "Formato inválido.",
  not_acceptable: "Formato de resposta não suportado.",
  not_authenticated: "Sessão expirada. Entre novamente.",
  not_found: "Registro não encontrado.",
  null: "Campo obrigatório.",
  parse_error: "Requisição inválida.",
  "people_individual.company.mismatch": "O documento pertence a outra empresa.",
  "people_individual.cpf.duplicate_in_company": "Já existe uma pessoa com este CPF nesta empresa.",
  "people_individual.rg.duplicate_in_company": "Já existe uma pessoa com este RG nesta empresa.",
  "people_legal.cnpj.duplicate_in_company": "Já existe uma pessoa com este CNPJ nesta empresa.",
  "people_legal.company.mismatch": "O documento pertence a outra empresa.",
  "percentage.out_of_range": "O percentual deve ficar entre 0 e 100.",
  permission_denied: "Você não tem permissão para esta ação.",
  required: "Campo obrigatório.",
  "supplier.bank_data.incomplete": "Informe banco, agência e conta juntos.",
  throttled: "Muitas tentativas. Aguarde um instante e tente novamente.",
  token_not_valid: "Sessão inválida ou expirada. Entre novamente.",
  unique: "Já existe um cadastro com este valor.",
  unique_together: "Já existe um cadastro com este valor.",
  "unit.block.other_condominium": "O bloco pertence a outro condomínio.",
  "unit.ideal_fraction.out_of_range": "A fração ideal deve ser maior que 0 e no máximo 1.",
  "unit.ideal_fraction.sum_exceeds_total":
    "As frações ideais das unidades ativas do condomínio passariam de 1.",
  "unit.name.duplicate_in_block": "Já existe uma unidade com este nome neste bloco.",
  "unit.name.duplicate_in_condominium": "Já existe uma unidade com este nome neste condomínio.",
  "unit.utility_values.negative": "Os valores de consumo não podem ser negativos.",
  "unit_person.end_date.before_start_date": "O fim não pode ser anterior ao início.",
  "unit_person.ownership_percentage.not_allowed_for_tenant":
    "Inquilino não tem percentual de propriedade.",
  "unit_person.ownership_percentage.required_for_owner":
    "O proprietário precisa de um percentual entre 0 e 100.",
  "unit_person.ownership_percentage.sum_exceeds_100":
    "Os proprietários desta unidade passariam de 100% no mesmo período.",
  "unit_person.person.duplicate_active_link": "Esta pessoa já tem um vínculo ativo com este papel.",
  "unit_person.person.other_company": "A pessoa pertence a outra empresa.",
  unsupported_media_type: "Formato de envio não suportado.",
  user_inactive: "Usuário inativo.",
  user_not_found: "Usuário não encontrado.",
  "value.negative": "O valor não pode ser negativo.",
};

/** A mensagem em português do código; sem tradução (backend mais novo), usa a mensagem da API. */
export function errorMessage(code: string, fallback: string): string {
  return (ERROR_MESSAGES as Record<string, string>)[code] ?? fallback;
}
