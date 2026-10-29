from django.template.loader import render_to_string

from apps.billing.services.delinquency_report import DelinquencyReport
from apps.core.infrastructure.formatting import format_date, format_money, format_month
from apps.core.infrastructure.pdf import render_pdf

TEMPLATE = "billing/delinquency_report.html"


def render_delinquency_pdf(report: DelinquencyReport, company_name: str) -> bytes:
    """The overdue-boletos report as PDF bytes (text is escaped by the template engine)."""
    context = {
        "company_name": company_name,
        "as_of": format_date(report.as_of),
        "count": report.count,
        "total": format_money(report.total_amount),
        "truncated": report.truncated,
        "by_condominium": [
            {"name": line.condominium_name, "count": line.count, "total": format_money(line.total_amount)}
            for line in report.by_condominium
        ],
        "rows": [
            {
                "condominium": row.condominium_name,
                "unit": row.unit_name,
                "payer": row.payer_name,
                "reference_month": format_month(row.reference_month),
                "due_date": format_date(row.due_date),
                "days_overdue": row.days_overdue,
                "amount": format_money(row.amount),
            }
            for row in report.rows
        ],
    }
    return render_pdf(render_to_string(TEMPLATE, context))
