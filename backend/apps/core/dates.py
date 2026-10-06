import calendar
from datetime import date


def add_months(start_date: date, months: int) -> date:
    """`start_date` plus `months`, clamping the day to the last day of the target month."""
    months_since_year_zero = start_date.year * 12 + start_date.month - 1 + months
    year, month = divmod(months_since_year_zero, 12)
    month += 1
    last_day_of_month = calendar.monthrange(year, month)[1]
    return date(year, month, min(start_date.day, last_day_of_month))
