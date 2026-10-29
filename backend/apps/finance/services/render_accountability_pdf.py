from django.template.loader import render_to_string

from apps.core.infrastructure.formatting import format_date, format_money, format_month
from apps.core.infrastructure.pdf import render_pdf
from apps.finance.models import CurrentAccountEntry
from apps.finance.services.build_accountability_report import AccountabilityReport

TEMPLATE = "finance/accountability_report.html"


def render_accountability_pdf(report: AccountabilityReport, company_name: str) -> bytes:
    """The month's accountability as PDF bytes (text is escaped by the template engine)."""
    context = {
        "company_name": company_name,
        "condominium": f"{report.condominium_code:04d} · {report.condominium_name}",
        "month": format_month(report.month),
        "opening_balance": format_money(report.opening_balance),
        "total_credits": format_money(report.total_credits),
        "total_debits": format_money(report.total_debits),
        "closing_balance": format_money(report.closing_balance),
        "truncated": report.truncated,
        "by_cost_center": [
            {
                "label": f"{line.cost_center_code:04d} · {line.cost_center_name}",
                "opening_balance": format_money(line.opening_balance),
                "total_credits": format_money(line.total_credits),
                "total_debits": format_money(line.total_debits),
                "closing_balance": format_money(line.closing_balance),
            }
            for line in report.by_cost_center
        ],
        "entries": [
            {
                "entry_date": format_date(entry.entry_date),
                "description": entry.description,
                "cost_center": entry.cost_center_name,
                "template": entry.entry_template_name,
                "unit": entry.unit_name or "",
                "credit": format_money(entry.amount) if entry.kind == CurrentAccountEntry.Kind.CREDIT else "",
                "debit": format_money(entry.amount) if entry.kind == CurrentAccountEntry.Kind.DEBIT else "",
            }
            for entry in report.entries
        ],
    }
    return render_pdf(render_to_string(TEMPLATE, context))
