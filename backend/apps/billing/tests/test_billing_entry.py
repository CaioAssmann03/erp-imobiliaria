"""Billing entries: allocation, recurrence, rules and the freeze once used (spec 039, R2–R5, R8)."""

from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from apps.condominiums.models import Condominium, Unit
from apps.condominiums.tests.base import add_fraction, criterion_at
from apps.finance.models import CostCenter, EntryTemplate

from ..models import BillingEntry, BillingEntryUnit, BillingEvent

pytestmark = pytest.mark.django_db

OCTOBER = date(2026, 10, 1)


@pytest.fixture
def make_entry(condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate):  # type: ignore[no-untyped-def]
    def make(**overrides) -> BillingEntry:  # type: ignore[no-untyped-def]
        fields = {
            "condominium": condominium,
            "allocation": BillingEntry.Allocation.INDIVIDUAL,
            "recurrence": BillingEntry.Recurrence.ONCE,
            "start_month": OCTOBER,
            "cost_center": cost_center,
            "amount": Decimal("100.00"),
        }
        entry = BillingEntry(**{**fields, **overrides})
        entry.full_clean()
        entry.save()
        return entry

    return make


def units_of(*fractions: str) -> list[Unit]:
    """Units of the condominium, each with its fraction in the main criterion."""
    condominium = Condominium.objects.get()
    units = [
        Unit.objects.create(condominium=condominium, name=f"10{index}")
        for index, _ in enumerate(fractions, start=1)
    ]
    for unit, fraction in zip(units, fractions, strict=True):
        _ = add_fraction(unit, fraction)
    return units


# ----- R3: allocation -----


def test_individual_gives_each_unit_the_amount_or_its_own(make_entry) -> None:  # type: ignore[no-untyped-def]
    first, second = units_of("0.5", "0.5")
    entry = make_entry()

    amounts = entry.amounts_by_unit([first, second], {second.pk: Decimal("80.00")})

    assert amounts == {first.pk: Decimal("100.00"), second.pk: Decimal("80.00")}


def test_collective_splits_equally_and_the_parts_add_up(make_entry) -> None:  # type: ignore[no-untyped-def]
    units = units_of("0.3", "0.3", "0.4")
    entry = make_entry(allocation=BillingEntry.Allocation.COLLECTIVE, amount=Decimal("100.00"))

    amounts = entry.amounts_by_unit(units)

    assert sum(amounts.values()) == Decimal("100.00")
    assert sorted(amounts.values()) == [Decimal("33.33"), Decimal("33.33"), Decimal("33.34")]


def test_fraction_splits_by_the_selected_units_fractions(make_entry) -> None:  # type: ignore[no-untyped-def]
    first, second, third = units_of("0.2", "0.3", "0.5")
    entry = make_entry(
        allocation=BillingEntry.Allocation.FRACTION,
        apportionment_criterion=criterion_at(Condominium.objects.get()),
        amount=Decimal("100.00"),
    )

    selected = entry.amounts_by_unit([second, third])

    assert selected == {second.pk: Decimal("37.50"), third.pk: Decimal("62.50")}
    assert sum(entry.amounts_by_unit([first, second, third]).values()) == Decimal("100.00")


# ----- R4: recurrence -----


def test_once_covers_only_its_month(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry()

    assert [entry.covers(date(2026, month, 1)) for month in (9, 10, 11)] == [False, True, False]


def test_installments_cover_n_months_and_say_which(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry(recurrence=BillingEntry.Recurrence.INSTALLMENTS, installments_total=3, start_month=date(2026, 11, 1))

    assert [entry.covers(date(2027, month, 1)) for month in (1, 2, 3, 4)] == [True, False, False, False]
    assert [entry.covers(date(2026, month, 1)) for month in (10, 11, 12)] == [False, True, True]
    assert entry.installment_label(date(2026, 12, 1)) == "2/3"
    assert entry.installment_label(date(2027, 1, 1)) == "3/3"


def test_always_runs_until_it_is_ended(make_entry) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry(recurrence=BillingEntry.Recurrence.ALWAYS, end_month=date(2027, 3, 1))

    assert [entry.covers(date(2027, month, 1)) for month in (2, 3, 4)] == [True, True, False]
    assert not entry.covers(date(2026, 9, 1))


def test_the_queryset_agrees_with_covers(make_entry) -> None:  # type: ignore[no-untyped-def]
    once = make_entry()
    installments = make_entry(recurrence=BillingEntry.Recurrence.INSTALLMENTS, installments_total=2)
    always = make_entry(recurrence=BillingEntry.Recurrence.ALWAYS, end_month=date(2026, 12, 1))
    entries = [once, installments, always]

    for month in range(8, 15):
        reference = date(2026 + (month - 1) // 12, (month - 1) % 12 + 1, 1)
        expected = {entry.pk for entry in entries if entry.covers(reference)}
        assert {entry.pk for entry in BillingEntry.objects.in_force(reference)} == expected, reference


# ----- R2, R5: the rules and the line -----


def test_the_entry_template_is_the_only_active_one_of_the_cost_center(make_entry, entry_template: EntryTemplate) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry()

    assert entry.entry_template == entry_template


def test_a_cost_center_without_exactly_one_template_is_refused(  # type: ignore[no-untyped-def]
    make_entry, condominium: Condominium, entry_template: EntryTemplate
) -> None:
    _ = EntryTemplate.objects.create(cost_center=entry_template.cost_center, name="Outro")
    with pytest.raises(ValidationError) as several:
        make_entry()
    bare = CostCenter.objects.create(condominium=condominium, name="Sem modelo")
    with pytest.raises(ValidationError) as none:
        make_entry(cost_center=bare)

    for raised in (several, none):
        assert "must have exactly one active entry template" in raised.value.error_dict["cost_center"][0].messages[0]


@pytest.mark.parametrize(
    "overrides, field",
    [
        ({"allocation": "fraction"}, "apportionment_criterion"),
        ({"recurrence": "installments"}, "installments_total"),
        ({"recurrence": "installments", "installments_total": 1}, "installments_total"),
        ({"installments_total": 3}, "installments_total"),
        ({"end_month": date(2026, 12, 1)}, "end_month"),
        ({"recurrence": "always", "end_month": date(2026, 9, 1)}, "end_month"),
    ],
)
def test_the_kind_specific_fields_must_match(make_entry, overrides: dict[str, object], field: str) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(ValidationError) as raised:
        make_entry(**overrides)

    assert field in raised.value.error_dict


def test_an_event_of_another_company_is_refused(make_entry, other_company) -> None:  # type: ignore[no-untyped-def]
    foreign = BillingEvent.objects.create(company=other_company, code=1, name="Estranho")

    with pytest.raises(ValidationError) as raised:
        make_entry(event=foreign)

    assert "event" in raised.value.error_dict


def test_the_line_names_the_event_the_description_and_the_installment(make_entry, company) -> None:  # type: ignore[no-untyped-def]
    event = BillingEvent.objects.create(company=company, code=250, name="Limpeza do condomínio")
    plain = make_entry(event=event, description="10/2026")
    parcelled = make_entry(
        event=event, recurrence=BillingEntry.Recurrence.INSTALLMENTS, installments_total=3, start_month=date(2026, 9, 1)
    )

    assert plain.line_description(OCTOBER) == "Limpeza do condomínio - 10/2026"
    assert parcelled.line_description(OCTOBER) == "Limpeza do condomínio (2/3)"


# ----- R8: a used entry is frozen -----


def test_an_entry_a_document_was_issued_from_cannot_change_or_go(make_entry, document, entry_template) -> None:  # type: ignore[no-untyped-def]
    entry = make_entry(recurrence=BillingEntry.Recurrence.ALWAYS)
    item = document.items.get(position=1)
    item.billing_entry = entry
    item.save()

    entry.amount = Decimal("999.00")
    with pytest.raises(ValidationError) as changed:
        entry.full_clean()
    entry.refresh_from_db()
    entry.end_month = date(2026, 12, 1)
    entry.full_clean()
    entry.save()
    with pytest.raises(ValidationError):
        entry.delete()

    assert "amount" in changed.value.error_dict
    assert BillingEntry.objects.filter(pk=entry.pk).exists()


def test_a_unit_amount_only_for_an_individual_entry(make_entry) -> None:  # type: ignore[no-untyped-def]
    (unit,) = units_of("1")
    collective = make_entry(allocation=BillingEntry.Allocation.COLLECTIVE)

    link = BillingEntryUnit(entry=collective, unit=unit, amount=Decimal("5.00"))

    with pytest.raises(ValidationError) as raised:
        link.full_clean()
    assert "amount" in raised.value.error_dict


def test_a_criterion_only_for_a_fraction_entry(make_entry, condominium: Condominium) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(ValidationError) as raised:
        make_entry(apportionment_criterion=criterion_at(condominium))

    assert "apportionment_criterion" in raised.value.error_dict


def test_the_criterion_must_belong_to_the_entrys_condominium(make_entry, other_condominium: Condominium) -> None:  # type: ignore[no-untyped-def]
    with pytest.raises(ValidationError) as raised:
        make_entry(
            allocation=BillingEntry.Allocation.FRACTION,
            apportionment_criterion=criterion_at(other_condominium),
        )

    assert "billing_entry.apportionment_criterion.other_condominium" in [
        error.code for error in raised.value.error_dict["apportionment_criterion"]
    ]
