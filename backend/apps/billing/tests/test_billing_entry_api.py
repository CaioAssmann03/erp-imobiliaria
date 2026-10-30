"""Billing events and entries API: CRUD, units, preview, month view, end, freeze, scoping (spec 039, R1, R2, R6–R9)."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit
from apps.condominiums.tests.base import add_fraction, criterion_at
from apps.core.models import Company
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.tests.base import body, errors, results

from ..models import BillingDocument, BillingEntry, BillingEvent

pytestmark = pytest.mark.django_db

EVENTS = "billing-event-list"
EVENT = "billing-event-detail"
ENTRIES = "billing-entry-list"
ENTRY = "billing-entry-detail"
PREVIEW = "billing-entry-preview"
END = "billing-entry-end"


def make_units(condominium: Condominium, names: tuple[str, ...] = ("101", "102", "103")) -> list[Unit]:
    """Units with the fractions 0.2, 0.3 and 0.5 in the main criterion."""
    units = [Unit.objects.create(condominium=condominium, name=name) for name in names]
    for unit, fraction in zip(units, ("0.2", "0.3", "0.5"), strict=True):
        _ = add_fraction(unit, fraction)
    return units


def error_codes(response: object) -> list[str | None]:
    """Every code of the flat error body, whatever its field."""
    return [item["code"] for item in errors(response)]  # type: ignore[arg-type]


def entry_payload(condominium: Condominium, cost_center: CostCenter, units: list[Unit], **overrides: Any) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "condominium": str(condominium.pk),
        "description": "10/2026",
        "allocation": "collective",
        "recurrence": "once",
        "start_month": "2026-10-01",
        "cost_center": str(cost_center.pk),
        "amount": "100.00",
        "units": [{"unit": str(unit.pk)} for unit in units],
    }
    return {**payload, **overrides}


# ----- R1: events -----


def test_event_crud_and_unique_code(api_client: APIClient, company: Company) -> None:
    created = api_client.post(reverse(EVENTS), {"code": 250, "name": "Limpeza do condomínio"}, format="json")
    duplicate = api_client.post(reverse(EVENTS), {"code": 250, "name": "Outro"}, format="json")

    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert BillingEvent.objects.get().company == company
    assert duplicate.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_event.code.duplicate_in_company" in error_codes(duplicate)
    renamed = api_client.patch(reverse(EVENT, args=[body(created)["id"]]), {"name": "Limpeza"}, format="json")
    assert body(renamed)["name"] == "Limpeza"


def test_an_event_left_without_code_gets_the_lowest_free_one_of_the_company(
    api_client: APIClient, company: Company, other_company: Company
) -> None:
    _ = BillingEvent.objects.create(company=other_company, code=2, name="Alheio")

    first = api_client.post(reverse(EVENTS), {"name": "Primeiro"}, format="json")
    typed = api_client.post(reverse(EVENTS), {"code": 250, "name": "Limpeza"}, format="json")
    second = api_client.post(reverse(EVENTS), {"name": "Segundo"}, format="json")
    third = api_client.post(reverse(EVENTS), {"name": "Terceiro"}, format="json")

    # 250 typed by hand does not move the sequence: 1, then 2, then 3. The other company's 2 does not count.
    assert [body(response)["code"] for response in (first, typed, second, third)] == [1, 250, 2, 3]


def test_the_sequence_skips_the_codes_taken_by_hand_and_fills_the_gaps(api_client: APIClient, company: Company) -> None:
    for code in (1, 3, 4, 6):
        _ = BillingEvent.objects.create(company=company, code=code, name=f"Evento {code}")

    created = [body(api_client.post(reverse(EVENTS), {"name": f"Novo {n}"}, format="json"))["code"] for n in range(4)]

    assert created == [2, 5, 7, 8]


def test_a_code_freed_by_a_deletion_is_given_again(api_client: APIClient, company: Company) -> None:
    for code in (1, 2, 3):
        _ = BillingEvent.objects.create(company=company, code=code, name=f"Evento {code}")
    _ = BillingEvent.objects.get(code=2).delete()

    assert BillingEvent.next_code_in(company.pk) == 2
    assert body(api_client.post(reverse(EVENTS), {"name": "Volta o 2"}, format="json"))["code"] == 2


def test_a_null_code_is_refused_so_a_patch_never_changes_it_by_accident(api_client: APIClient, company: Company) -> None:
    event = BillingEvent.objects.create(company=company, code=7, name="Taxa")

    response = api_client.patch(reverse(EVENT, args=[event.pk]), {"code": None}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    event.refresh_from_db()
    assert event.code == 7


def test_a_typed_code_still_has_to_be_free(api_client: APIClient, company: Company) -> None:
    _ = BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO")

    duplicate = api_client.post(reverse(EVENTS), {"code": 5, "name": "Outro"}, format="json")

    assert duplicate.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_event.code.duplicate_in_company" in error_codes(duplicate)


def test_events_of_another_company_are_invisible(api_client: APIClient, other_company: Company) -> None:
    _ = BillingEvent.objects.create(company=other_company, code=1, name="Alheio")

    assert results(api_client.get(reverse(EVENTS))) == []


# ----- R2: create with units -----


def test_create_an_entry_with_its_units(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate, company: Company
) -> None:
    event = BillingEvent.objects.create(company=company, code=250, name="Limpeza do condomínio")
    units = make_units(condominium)

    response = api_client.post(
        reverse(ENTRIES), entry_payload(condominium, cost_center, units, event=str(event.pk)), format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    data = body(response)
    assert str(data["entry_template"]) == str(entry_template.pk)
    assert (data["event_code"], data["cost_center_code"], data["is_used"]) == (250, cost_center.code, False)
    assert {unit["unit_name"] for unit in data["units"]} == {"101", "102", "103"}


def test_a_bad_unit_is_reported_under_units(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    foreign = Unit.objects.create(condominium=other_condominium, name="1")

    response = api_client.post(reverse(ENTRIES), entry_payload(condominium, cost_center, [foreign]), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_entry.unit.other_condominium" in error_codes(response)


def test_an_empty_selection_is_refused(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    response = api_client.post(reverse(ENTRIES), entry_payload(condominium, cost_center, []), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_a_fraction_entry_needs_units_with_that_fraction(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    bare = Unit.objects.create(condominium=condominium, name="104")

    response = api_client.post(
        reverse(ENTRIES),
        entry_payload(
            condominium, cost_center, [bare], allocation="fraction", apportionment_criterion=str(criterion_at(condominium).pk)
        ),
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_entry.unit.without_fraction" in error_codes(response)


# ----- R6: preview, R7: the month view -----


def test_preview_answers_the_per_unit_values_without_saving(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    units = make_units(condominium)

    response = api_client.post(
        reverse(PREVIEW) + "?reference_month=2026-10-01",
        entry_payload(
            condominium, cost_center, units, allocation="fraction", apportionment_criterion=str(criterion_at(condominium).pk)
        ),
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    data = body(response)
    assert {row["unit_name"]: Decimal(row["amount"]) for row in data["unit_amounts"]} == {
        "101": Decimal("20.00"),
        "102": Decimal("30.00"),
        "103": Decimal("50.00"),
    }
    assert Decimal(data["total"]) == Decimal("100.00")
    assert not BillingEntry.objects.exists()


def test_the_list_of_a_month_carries_the_values_of_that_month(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    units = make_units(condominium)
    created = api_client.post(
        reverse(ENTRIES),
        entry_payload(condominium, cost_center, units, recurrence="installments", installments_total=3),
        format="json",
    )
    assert created.status_code == status.HTTP_201_CREATED, created.data

    november = results(api_client.get(reverse(ENTRIES), {"reference_month": "2026-11-01", "condominium": str(condominium.pk)}))
    january = results(api_client.get(reverse(ENTRIES), {"reference_month": "2027-01-01"}))

    assert len(november) == 1 and november[0]["month"]["installment"] == "2/3"
    assert sum(Decimal(row["amount"]) for row in november[0]["month"]["unit_amounts"]) == Decimal("100.00")
    assert january == []


# ----- R8: freeze, end -----


def test_a_used_entry_cannot_be_changed_or_deleted_but_can_be_ended(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate, document: BillingDocument
) -> None:
    units = make_units(condominium, ("201", "202", "203"))
    created = api_client.post(
        reverse(ENTRIES), entry_payload(condominium, cost_center, units, recurrence="always"), format="json"
    )
    entry_id = body(created)["id"]
    item = document.items.get(position=1)
    item.billing_entry = BillingEntry.objects.get(pk=entry_id)
    item.save()

    changed = api_client.patch(reverse(ENTRY, args=[entry_id]), {"amount": "5.00"}, format="json")
    deleted = api_client.delete(reverse(ENTRY, args=[entry_id]))
    ended = api_client.post(reverse(END, args=[entry_id]), {"end_month": "2026-12-15"}, format="json")

    assert changed.status_code == status.HTTP_400_BAD_REQUEST and "billing_entry.already_used" in error_codes(changed)
    assert deleted.status_code == status.HTTP_400_BAD_REQUEST
    assert ended.status_code == status.HTTP_200_OK, ended.data
    assert body(ended)["end_month"] == "2026-12-01"
    assert body(api_client.get(reverse(ENTRY, args=[entry_id])))["is_used"] is True


def test_an_unused_entry_can_be_changed_with_new_units(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    units = make_units(condominium)
    entry_id = body(api_client.post(reverse(ENTRIES), entry_payload(condominium, cost_center, units), format="json"))["id"]

    changed = api_client.patch(
        reverse(ENTRY, args=[entry_id]), {"amount": "60.00", "units": [{"unit": str(units[0].pk)}]}, format="json"
    )

    assert changed.status_code == status.HTTP_200_OK, changed.data
    assert body(changed)["amount"] == "60.00" and len(body(changed)["units"]) == 1


# ----- R9: scoping -----


def test_entries_of_another_company_are_invisible(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate, other_company: Company
) -> None:
    units = make_units(condominium)
    _ = api_client.post(reverse(ENTRIES), entry_payload(condominium, cost_center, units), format="json")
    foreign_client = APIClient()
    from apps.accounts.models import User

    foreign_client.force_authenticate(user=User.objects.create_user(username="other", password="x", company=other_company))

    assert results(foreign_client.get(reverse(ENTRIES))) == []


@pytest.mark.usefixtures("entry_template")
def test_query_searches_event_description_and_cost_center(api_client: APIClient, condominium: Condominium, cost_center: CostCenter) -> None:
    units = make_units(condominium)
    event = BillingEvent.objects.create(company=condominium.company, code=250, name="Limpeza do condomínio")
    for overrides in ({"event": str(event.pk), "description": "10/2026"}, {"description": "Reparo do portão"}):
        created = api_client.post(reverse(ENTRIES), entry_payload(condominium, cost_center, units, **overrides), format="json")
        assert created.status_code == status.HTTP_201_CREATED, created.data

    def found(term: str) -> list[str]:
        listed = results(api_client.get(reverse(ENTRIES), {"condominium": str(condominium.pk), "query": term}))
        return sorted(row["description"] for row in listed)

    assert found("limpeza") == ["10/2026"]
    assert found("portão") == ["Reparo do portão"]
    assert found(cost_center.name) == ["10/2026", "Reparo do portão"]
    assert found("zzz") == []


def test_events_filter_by_credits_company(api_client: APIClient, company: Company) -> None:
    _ = BillingEvent.objects.create(company=company, code=1, name="Taxa do condomínio")
    _ = BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO", credits_company=True)

    def names(value: str) -> list[str]:
        return [row["name"] for row in results(api_client.get(reverse(EVENTS), {"credits_company": value}))]

    assert names("true") == ["TARIFA BANCO"]
    assert names("false") == ["Taxa do condomínio"]
