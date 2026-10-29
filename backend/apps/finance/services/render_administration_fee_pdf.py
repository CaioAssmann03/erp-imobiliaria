from decimal import Decimal

from django.template.loader import render_to_string

from apps.billing.infrastructure.rendering.boleto_template import format_percentage
from apps.core.infrastructure.formatting import format_money, format_month
from apps.core.infrastructure.pdf import render_pdf
from apps.finance.services.build_administration_fee_report import AdministrationFeeReport, AdministrationFeeRow

TEMPLATE = "finance/administration_fee_report.html"
BASIS_LABELS = {"revenue": "da receita", "expense": "da despesa"}
STATUS_LABELS = {"due": "", "not_started": "Contrato ainda não iniciado", "no_contract": "Sem contrato cadastrado"}


def _rule_text(row: AdministrationFeeRow) -> str:
    """How the fee of the row is set, in words: the fixed amount, or the percentage of the basis with its limits."""
    if row.fee_type == "fixed":
        return "Valor fixo"
    if row.fee_type == "variable":
        parts = [f"{format_percentage(row.fee_percentage or Decimal(0))} {BASIS_LABELS.get(row.fee_basis or '', '')}".strip()]
        if row.fee_floor is not None:
            parts.append(f"mínimo {format_money(row.fee_floor)}")
        if row.fee_ceiling is not None:
            parts.append(f"máximo {format_money(row.fee_ceiling)}")
        return ", ".join(parts)
    return ""


def render_administration_fee_pdf(report: AdministrationFeeReport, company_name: str) -> bytes:
    """The month's administration fee per condominium as PDF bytes (text is escaped by the template engine)."""
    context = {
        "company_name": company_name,
        "month": format_month(report.month),
        "count": report.count,
        "total_fee": format_money(report.total_fee),
        "rows": [
            {
                "condominium": f"{row.condominium_code:04d} · {row.condominium_name}",
                "rule": _rule_text(row),
                "base": format_money(row.base_amount) if row.base_amount is not None else "",
                "fee_due": format_money(row.fee_due) if row.status == "due" else "",
                "iss": "Sim" if row.charges_iss_on_fee else "",
                "note": STATUS_LABELS[row.status],
            }
            for row in report.rows
        ],
    }
    return render_pdf(render_to_string(TEMPLATE, context))
