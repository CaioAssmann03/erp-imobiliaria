from django.template.loader import render_to_string

from apps.billing.infrastructure.rendering.boleto_template import format_percentage
from apps.billing.models import BillingDocument
from apps.condominiums.models import Unit, UnitPerson
from apps.core.infrastructure.formatting import format_date, format_money, format_month
from apps.core.infrastructure.pdf import render_pdf
from apps.finance.models import CurrentAccountEntry
from apps.finance.services.build_unit_sheet import UnitSheet

TEMPLATE = "finance/unit_sheet.html"
UNIT_TYPE_LABELS: dict[str, str] = {
    Unit.UnitType.APARTMENT: "Apartamento",
    Unit.UnitType.OFFICE: "Sala",
    Unit.UnitType.STORE: "Loja",
    Unit.UnitType.HOUSE: "Casa",
    Unit.UnitType.SUITE: "Conjunto",
    Unit.UnitType.PARKING_SPACE: "Box",
    Unit.UnitType.OTHER: "Outros",
}
ROLE_LABELS: dict[str, str] = {UnitPerson.Role.OWNER: "Proprietário", UnitPerson.Role.TENANT: "Inquilino"}
STATUS_LABELS: dict[str, str] = {
    BillingDocument.Status.ISSUED: "Emitido",
    BillingDocument.Status.REGISTERED: "Registrado",
    BillingDocument.Status.PAID: "Pago",
    BillingDocument.Status.CANCELLED: "Cancelado",
}
KIND_LABELS: dict[str, str] = {BillingDocument.Kind.MONTHLY: "Mensal", BillingDocument.Kind.EXTRA: "Extra"}


def render_unit_sheet_pdf(sheet: UnitSheet, company_name: str) -> bytes:
    """The unit sheet as PDF bytes (text is escaped by the template engine)."""
    unit_label = f"{sheet.block_name} - {sheet.unit_name}" if sheet.block_name else sheet.unit_name
    context = {
        "company_name": company_name,
        "condominium": f"{sheet.condominium_code:04d} · {sheet.condominium_name}",
        "unit_label": unit_label,
        "period": f"{format_month(sheet.from_month)} a {format_month(sheet.to_month)}",
        "unit_type": UNIT_TYPE_LABELS.get(sheet.unit_type, sheet.unit_type),
        "situation": ", ".join(
            filter(
                None,
                [
                    "Ativa" if sheet.is_active else "Inativa",
                    "Unidade do síndico" if sheet.is_manager_unit else "",
                    "Cobrança bloqueada" if sheet.is_billing_blocked else "",
                ],
            )
        ),
        "registration_number": sheet.registration_number,
        "resident_count": sheet.resident_count,
        "gas_value": format_money(sheet.gas_value),
        "water_value": format_money(sheet.water_value),
        "electricity_value": format_money(sheet.electricity_value),
        "fractions": [{"name": item.criterion_name, "value": f"{item.value:.6f}".rstrip("0").rstrip(".").replace(".", ",")} for item in sheet.fractions],
        "people": [
            {
                "role": ROLE_LABELS.get(person.role, person.role),
                "name": person.name,
                "percentage": format_percentage(person.ownership_percentage) if person.ownership_percentage is not None else "",
                "since": format_date(person.start_date),
                "until": format_date(person.end_date) if person.end_date else "",
            }
            for person in sheet.people
        ],
        "total_issued": format_money(sheet.total_issued),
        "total_paid": format_money(sheet.total_paid),
        "total_open": format_money(sheet.total_open),
        "total_overdue": format_money(sheet.total_overdue),
        "boletos_truncated": sheet.boletos_truncated,
        "boletos": [
            {
                "reference": format_month(item.reference_month),
                "kind": KIND_LABELS.get(item.kind, item.kind),
                "due_date": format_date(item.due_date),
                "amount": format_money(item.amount),
                "status": "Vencido" if item.is_overdue else STATUS_LABELS.get(item.status, item.status),
                "days_overdue": item.days_overdue or "",
                "paid_on": format_date(item.paid_on) if item.paid_on else "",
            }
            for item in sheet.boletos
        ],
        "total_credits": format_money(sheet.total_credits),
        "total_debits": format_money(sheet.total_debits),
        "entries_truncated": sheet.entries_truncated,
        "entries": [
            {
                "entry_date": format_date(entry.entry_date),
                "description": entry.description,
                "cost_center": entry.cost_center_name,
                "credit": format_money(entry.amount) if entry.kind == CurrentAccountEntry.Kind.CREDIT else "",
                "debit": format_money(entry.amount) if entry.kind == CurrentAccountEntry.Kind.DEBIT else "",
            }
            for entry in sheet.entries
        ],
    }
    return render_pdf(render_to_string(TEMPLATE, context))
