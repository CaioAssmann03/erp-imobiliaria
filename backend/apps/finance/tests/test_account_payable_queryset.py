"""AccountPayableQuerySet: the date windows and `totals()`."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.infrastructure.search.term import classify_term

from ..models import AccountPayable

pytestmark = pytest.mark.django_db

TODAY = date(2026, 10, 23)


def test_totals_of_no_accounts_is_zero() -> None:
    assert AccountPayable.objects.none().totals() == {"count": 0, "total": Decimal(0)}


def test_totals_counts_and_sums_only_the_queryset(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(due_date=date(2026, 10, 1), amount=Decimal("100.50"))
    make_account(due_date=date(2026, 10, 2), amount=Decimal("200.00"))
    make_account(due_date=date(2026, 11, 2), amount=Decimal("999.00"))

    assert AccountPayable.objects.overdue(TODAY).totals() == {"count": 2, "total": Decimal("300.50")}


def make_accounts_due_on(make_account, *days: date) -> None:  # type: ignore[no-untyped-def]
    for day in days:
        make_account(due_date=day, description=day.isoformat())


def due_days(accounts) -> list[str]:  # type: ignore[no-untyped-def]
    return sorted(account.due_date.isoformat() for account in accounts)


def test_due_today_is_only_the_reference_date(make_account) -> None:  # type: ignore[no-untyped-def]
    make_accounts_due_on(make_account, date(2026, 10, 22), TODAY, date(2026, 10, 24))

    assert due_days(AccountPayable.objects.due_today(TODAY)) == ["2026-10-23"]


def test_due_next_7_days_starts_tomorrow_and_ends_after_seven_days(make_account) -> None:  # type: ignore[no-untyped-def]
    make_accounts_due_on(
        make_account, TODAY, date(2026, 10, 24), date(2026, 10, 30), date(2026, 10, 31)
    )

    assert due_days(AccountPayable.objects.due_next_7_days(TODAY)) == ["2026-10-24", "2026-10-30"]


def test_due_this_month_spans_the_first_to_the_last_day(make_account) -> None:  # type: ignore[no-untyped-def]
    make_accounts_due_on(
        make_account,
        date(2026, 9, 30),
        date(2026, 10, 1),
        TODAY,
        date(2026, 10, 31),
        date(2026, 11, 1),
    )

    assert due_days(AccountPayable.objects.due_this_month(TODAY)) == [
        "2026-10-01",
        "2026-10-23",
        "2026-10-31",
    ]


def test_due_this_month_in_february_of_a_leap_year(make_account) -> None:  # type: ignore[no-untyped-def]
    make_accounts_due_on(make_account, date(2028, 2, 29), date(2028, 3, 1))

    assert due_days(AccountPayable.objects.due_this_month(date(2028, 2, 10))) == ["2028-02-29"]


def test_windows_ignore_accounts_that_are_not_open(make_account) -> None:  # type: ignore[no-untyped-def]
    cancelled = make_account(due_date=TODAY)
    AccountPayable.objects.filter(pk=cancelled.pk).update(status=AccountPayable.Status.CANCELLED)

    assert not AccountPayable.objects.due_today(TODAY).exists()
    assert not AccountPayable.objects.due_this_month(TODAY).exists()


def test_open_by_due_date_orders_by_due_date_then_creation(make_account) -> None:  # type: ignore[no-untyped-def]
    later = make_account(due_date=date(2026, 11, 5), description="later")
    first_of_tie = make_account(due_date=date(2026, 10, 1), description="first of tie")
    second_of_tie = make_account(due_date=date(2026, 10, 1), description="second of tie")
    earliest = make_account(due_date=date(2026, 9, 1), description="earliest")

    assert list(AccountPayable.objects.open_by_due_date()) == [earliest, first_of_tie, second_of_tie, later]


def test_open_by_due_date_leaves_out_accounts_that_are_not_open(make_account) -> None:  # type: ignore[no-untyped-def]
    kept = make_account(due_date=date(2026, 10, 1))
    cancelled = make_account(due_date=date(2026, 9, 1))
    AccountPayable.objects.filter(pk=cancelled.pk).update(status=AccountPayable.Status.CANCELLED)

    assert list(AccountPayable.objects.open_by_due_date()) == [kept]


def test_with_supplier_and_condominium_needs_a_single_query(make_account, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_account(due_date=date(2026, 10, 1))
    make_account(due_date=date(2026, 10, 2), condominium=None, cost_center=None)

    with django_assert_num_queries(1):
        names = [
            (account.supplier.person.name, account.condominium.name if account.condominium else None)
            for account in AccountPayable.objects.open_by_due_date().with_supplier_and_condominium()
        ]

    assert [condominium for _, condominium in names] == ["Residencial Sol", None]


def found(term: str) -> list[str]:
    return [account.description for account in AccountPayable.objects.search(classify_term(term))]


def test_search_by_description_puts_the_ones_that_start_with_the_term_first(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Conta de energia")
    make_account(description="Energia eletrica")

    assert found("energia") == ["Energia eletrica", "Conta de energia"]


def test_search_by_document_number(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Com nota", document_number="NF 1042238")
    make_account(description="Sem nota")

    assert found("1042238") == ["Com nota"]


def test_search_by_supplier_name(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Qualquer conta")

    assert found("Companhia") == ["Qualquer conta"]


def test_search_among_equals_the_latest_due_date_comes_first(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Agua antiga", due_date=date(2026, 9, 1))
    make_account(description="Agua recente", due_date=date(2026, 11, 1))

    assert found("agua") == ["Agua recente", "Agua antiga"]


def test_a_single_digit_is_an_id_lookup_and_finds_no_account(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Conta 1", document_number="1")

    assert found("1") == []


def test_search_with_no_match_is_empty(make_account) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Energia")

    assert found("zzz") == []


def test_search_loads_supplier_and_condominium_in_the_same_query(make_account, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_account(description="Energia")

    with django_assert_num_queries(1):
        _ = [
            (account.supplier.person.name, account.condominium)
            for account in AccountPayable.objects.search(classify_term("energia"))
        ]
