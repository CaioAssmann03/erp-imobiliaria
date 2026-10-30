from collections.abc import Callable
from typing import Any, ClassVar, override

from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.http import HttpRequest
from unfold.admin import ModelAdmin

# Portuguese names of the fields the Admin shows, so forms and list headers read like the app (the models keep their English names).
FIELD_LABELS: dict[str, str] = {
    "name": "Nome", "code": "Código", "active": "Ativo", "company": "Empresa", "condominium": "Condomínio",
    "block": "Bloco", "unit": "Unidade", "person": "Pessoa", "supplier": "Fornecedor", "type": "Tipo",
    "kind": "Tipo", "description": "Descrição", "amount": "Valor", "due_date": "Vencimento", "issue_date": "Emissão",
    "status": "Situação", "payment_date": "Data do pagamento", "amount_paid": "Valor pago", "payment_method": "Forma de pagamento",
    "document_number": "Documento", "cost_center": "Sub-conta", "entry_template": "Modelo de lançamento", "balance": "Saldo",
    "entry_date": "Data", "batch_date": "Data do lote", "origin": "Origem", "email": "E-mail", "cnpj": "CNPJ", "cpf": "CPF",
    "advisor": "Assessor", "address": "Endereço", "municipal_registration": "Inscrição municipal", "water_meter": "Hidrômetro",
    "electricity_meter": "Medidor de energia", "gas_meter": "Medidor de gás", "resident_count": "Moradores",
    "is_manager_unit": "Unidade do síndico", "billing_recipient": "Quem recebe o boleto", "registration_number": "Matrícula",
    "gas_value": "Valor do gás", "water_value": "Valor da água", "electricity_value": "Valor da energia",
    "is_billing_blocked": "Cobrança bloqueada", "home_phone": "Telefone residencial", "business_phone": "Telefone comercial",
    "cell_number": "Celular", "bank_code": "Banco (código)", "bank_name": "Banco", "branch": "Agência", "account_number": "Conta",
    "account_kind": "Tipo de conta", "nickname": "Apelido", "pix_key": "Chave Pix", "start_month": "Mês inicial",
    "end_month": "Mês final", "start_date": "Início", "end_date": "Fim", "reference_month": "Mês de referência",
    "recurrence": "Recorrência", "allocation": "Rateio", "installments_total": "Parcelas", "event": "Evento",
    "apportionment_criterion": "Critério de rateio", "catalog_item": "Item do catálogo", "credits_company": "Crédito da imobiliária",
    "created_at": "Criado em", "updated_at": "Atualizado em", "deleted_at": "Excluído em", "anonymized_at": "Anonimizado em",
    "due_day": "Dia de vencimento", "due_on_business_day": "Vencimento por dia útil", "due_month": "Vencimento no mês",
    "competence_month": "Competência", "issuance_day": "Dia de emissão", "exempts_manager_unit": "Isenta a unidade do síndico",
    "late_fee_percentage": "Multa (%)", "initial_late_fee_percentage": "Multa nos primeiros dias (%)",
    "initial_late_fee_days": "Primeiros dias de atraso", "interest_calculation": "Cálculo dos juros",
    "interest_grace_days": "Carência dos juros (dias)", "early_payment_discount_percentage": "Desconto antecipado (%)",
    "early_payment_discount_days": "Prazo do desconto (dias)", "credit_limit": "Limite de crédito",
    "should_show_qr_code": "Exibir QR Code", "should_show_fee_statement": "Exibir demonstrativo de taxas",
    "monthly_percentage": "Juros ao mês (%)", "admin_fee_incidence_percentage": "Incidência da taxa de administração (%)",
    "has_accumulation_history": "Tem histórico de acúmulo", "accumulate_to_balance": "Acumula no saldo",
    "is_subject_to_social_security": "Sujeito à previdência", "credits_company_flag": "Crédito da imobiliária",
}


class MetriModelAdmin(ModelAdmin):
    """The base of every Admin of the system (spec 063): compact forms, filters in a side sheet, a warning for unsaved changes and
    Portuguese labels (`FIELD_LABELS` plus the admin's own `field_labels`) for the form fields and the list columns.
    """

    compressed_fields = True
    warn_unsaved_form = True
    list_filter_submit = True
    list_per_page = 25
    field_labels: ClassVar[dict[str, str]] = {}
    # Fields the database fills (a sequential code): shown on an existing record, left out of the add form, where they would show the SQL default.
    hide_on_add: ClassVar[tuple[str, ...]] = ()

    def _label_of(self, name: str) -> str | None:
        return self.field_labels.get(name) or FIELD_LABELS.get(name)

    @override
    def formfield_for_dbfield(self, db_field: "models.Field[Any, Any]", request: HttpRequest, **kwargs: Any) -> Any:
        formfield = super().formfield_for_dbfield(db_field, request, **kwargs)
        label = self._label_of(db_field.name)
        if formfield is not None and label is not None:
            formfield.label = label
        return formfield

    @override
    def get_fieldsets(self, request: HttpRequest, obj: Any = None) -> Any:
        fieldsets = super().get_fieldsets(request, obj)
        if obj is not None or not self.hide_on_add:
            return fieldsets
        return [
            (title, {**options, "fields": tuple(name for name in options["fields"] if name not in self.hide_on_add)})
            for title, options in fieldsets
        ]

    @override
    def get_list_display(self, request: HttpRequest) -> Any:
        return [self._column(name) for name in super().get_list_display(request)]

    def _column(self, name: Any) -> Any:
        """A plain model field of the list as a column with its Portuguese header, keeping sorting, choices and the yes/no icons."""
        label = self._label_of(name) if isinstance(name, str) else None
        if label is None:
            return name
        try:
            field = self.model._meta.get_field(name)
        except FieldDoesNotExist:
            return name
        if not field.concrete or field.many_to_many:
            return name

        def display(instance: Any) -> Any:
            return getattr(instance, f"get_{name}_display")() if getattr(field, "choices", None) else getattr(instance, name)

        column: Callable[[Any], Any] = display
        column.short_description = label  # type: ignore[attr-defined]
        column.admin_order_field = name  # type: ignore[attr-defined]
        column.boolean = isinstance(field, models.BooleanField)  # type: ignore[attr-defined]
        return column
