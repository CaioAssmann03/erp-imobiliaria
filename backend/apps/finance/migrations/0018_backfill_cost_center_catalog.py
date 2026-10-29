from collections import Counter, defaultdict

from django.db import migrations

TEMPORARY_CODE_BASE = 20000  # above any real code (small integers); keeps the unique code per condominium valid mid-rewrite


def backfill_catalog(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Group the sub-contas by name (ignoring case and spaces) into one catalog item per company.

    The item takes the code most used for that name; a code already taken by another name goes to the next free
    one. Every sub-conta then takes the item's code and name. Nothing is deleted.
    """
    CostCenter = apps.get_model("finance", "CostCenter")
    Item = apps.get_model("finance", "CostCenterCatalogItem")

    centers = list(CostCenter.objects.select_related("condominium").order_by("created_at", "id"))
    groups: dict[tuple, list] = defaultdict(list)
    seen: dict[tuple, set] = defaultdict(set)  # the condominiums already in each group
    for center in centers:
        company_id = center.condominium.company_id
        name = center.name.strip()
        suffix = 1
        key = (company_id, name.lower())
        while center.condominium_id in seen[key]:
            # The same name twice in one condominium (only the case differs): the later one is told apart.
            suffix += 1
            key = (company_id, f"{name} ({suffix})".lower())
        if suffix > 1:
            center.name = f"{name} ({suffix})"
        seen[key].add(center.condominium_id)
        groups[key].append(center)

    used_codes: dict = defaultdict(set)
    plan = []
    for (company_id, _key), group in sorted(groups.items(), key=lambda entry: min(c.created_at for c in entry[1])):
        name = Counter(c.name.strip() for c in group).most_common(1)[0][0]
        code = next((candidate for candidate, _ in Counter(c.code for c in group).most_common() if candidate not in used_codes[company_id]), None)
        if code is None:
            code = max(used_codes[company_id], default=-1) + 1
        used_codes[company_id].add(code)
        item = Item.objects.create(
            company_id=company_id, name=name, code=code, active=any(c.active for c in group)
        )
        plan.append((item, group))

    # Two passes, so a swap of codes inside a condominium never meets the unique code per condominium.
    for position, center in enumerate(centers):
        CostCenter.objects.filter(pk=center.pk).update(code=TEMPORARY_CODE_BASE + position)
    for item, group in plan:
        for center in group:
            CostCenter.objects.filter(pk=center.pk).update(catalog_item=item, code=item.code, name=item.name)


class Migration(migrations.Migration):
    """Spec 053, step 2 of 3: fill the catalog from the existing sub-contas."""

    dependencies = [("finance", "0017_cost_center_catalog")]

    operations = [migrations.RunPython(backfill_catalog, migrations.RunPython.noop)]
