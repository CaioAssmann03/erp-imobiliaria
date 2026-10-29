"""Brazilian text for money, dates and months, shared by every PDF and e-mail the system writes."""

from datetime import date
from decimal import Decimal

MONTH_NAMES = (
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
)


def format_money(amount: Decimal) -> str:
    sign = "-" if amount < 0 else ""
    whole, _, cents = f"{abs(amount):,.2f}".partition(".")
    return f"{sign}R$ {whole.replace(',', '.')},{cents}"


def format_date(value: date) -> str:
    return f"{value:%d/%m/%Y}"


def format_month(value: date) -> str:
    return f"{MONTH_NAMES[value.month - 1]}/{value.year}"
