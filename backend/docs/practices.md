---
summary: Pattern book (naming rules live in naming.md): business rules only in models, serializers with ModelRulesMixin, views, urls, admin, migrations, commands, tests.
read-when: you write or review any backend code
skip-if: only deciding where a file goes → architecture/structure/app-anatomy.md; only business formulas → architecture/data/domain-rules.md; only running commands → architecture/operations/local-dev.md
---
# Practices — follow the pattern the project already uses

## 1. Language and naming
**Names follow Clean Code: read `naming.md` before naming anything** (intention-revealing, no abbreviations, verbs for methods, `reference_date` instead of `on`, no flag arguments, ≤ 3 parameters).
- Code, comments, docs and API field names in **English**; API error messages in English (the frontend maps them to Portuguese).
- Files: `snake_case.py`; model file = entity (`unit_person.py`); serializers `<entity>_serializers.py`; views `<entity>_views.py`.
- Classes: `PascalCase`; ViewSets `<Entity>ViewSet`; serializers `<Entity>Serializer`; filters `<Entity>Filter`.
- URL resources plural kebab-case; router basename singular kebab-case. Constraint names `<model>_<rule>` (e.g. `unit_person_owner_percentage`).
- Demo/seed data may be Portuguese (it is sample content).

## 2. Business rules live ONLY in the models

A business rule is anything the domain says must be true ("fixed fee needs an amount", "owner needs a percentage", "block belongs to the unit's condominium").
**Write it in the model, and only there.** Serializers, views, services and tasks do not contain business rules; they call the model.

| Kind of rule | Where in the model | Example |
|---|---|---|
| One field's value (range, format) | a **validator** on the field (`validators=[...]`, functions in `validators.py`) | `validate_due_day`, `validate_ideal_fraction`, `validate_percentage`, `validate_cpf` |
| Several fields of the same record | `clean()` raising `ValidationError({"field": "message"})` (target the field the user must fix) | `AdministrationContract.clean`, `UnitPerson.clean` |
| Involves another record | `clean()` (reads related objects) | `Unit.clean`: block belongs to the condominium |
| Uniqueness, exclusion, last line of defence | `Meta.constraints` (`UniqueConstraint`, `CheckConstraint`) with `violation_error_message` | `unit_person_unique_active_link` |
| Derived value or behaviour the domain owns | a **model method / property** (`def current_links(self)`, `def next_adjustment_date(self)`) | add methods here, not in views |

- A rule that matters is usually written **twice inside the model**: `clean()`/validator (clear message, 400 in the API and admin) **and** a constraint (the database refuses it
  even if code skips validation). Both live in the same file; keep their messages identical.
- Models do **not** call `full_clean()` on `save()` (Django does not); entry points that must be validated call it: the admin form does automatically, serializers do through
  `ModelRulesMixin` (§3), commands/tasks that write data call `instance.full_clean()` before `save()`.
- `clean()` must not touch the network or send mail; it may read the database (related rows).
- SQL `CHECK (x >= 0)` accepts NULL: add `Q(x__isnull=False)` if NULL must fail (and check it in `clean()`).
- Calculations and state transitions belong to **model methods or queryset methods**, so every caller reuses them. Existing examples: `AdministrationContract.next_adjustment_date()` /
  `is_adjustment_overdue(reference_date)`, `UnitPerson.objects.current(reference_date)` / `is_current(reference_date)`, `Unit.objects.inconsistent_apportionment_condominium_ids()`, helper `core.dates.add_months`.
  Views (the dashboard included) only call them and shape the response. Queryset methods go in a `XxxQuerySet(models.QuerySet)` declared above the model (`objects = XxxQuerySet.as_manager()`).

## 2b. Models (`models/<entity>.py`)
```python
@final
class Block(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    condominium = models.ForeignKey(Condominium, on_delete=models.CASCADE, related_name="blocks")
    name = models.CharField(max_length=60)

    class Meta:
        verbose_name = "Block"
        verbose_name_plural = "Blocks"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(fields=("condominium", "name"), name="block_unique_name_per_condominium",
                                    violation_error_message="This condominium already has a block with this name"),
        )

    @override
    def __str__(self) -> str: return f"Block {self.name} of {self.condominium}"
```
- UUID pk; `created_at = DateTimeField(auto_now_add=True)`, `updated_at = DateTimeField(auto_now=True)`; `@final` (`typing_extensions`), `@override` on dunder/`clean`.
- `Meta.constraints` is **always a tuple**, even with one item; every constraint has `name` (+ `violation_error_message`).
- `null=True` only when "unknown" differs from "empty"; optional text uses `blank=True` (+ `null=True` only if the API must accept `null`).
- Enums: nested `models.TextChoices` with English values; English labels (the UI translates).
- Type hints for related managers and `_id` under `if TYPE_CHECKING: units: "RelatedManager[Unit]"; condominium_id: uuid.UUID`.
- Document validators come from `apps.core.validators` (CPF/CNPJ/percentage); documents are stored digits-only.
- `Meta.ordering` on anything the API lists (stable pagination).

## 3. Serializers (`serializers/<entity>_serializers.py`)
```python
class BlockSerializer(ModelRulesMixin, serializers.ModelSerializer[Block]):
    @final
    class Meta:
        model = Block
        fields = ("id", "condominium", "name")
        read_only_fields = ("id",)
```
- Serializers describe the **API shape** only: `fields`, `read_only_fields`, nested serializers, write orchestration. **No business rule inside** (no `validate` with domain logic,
  no `validate_<field>` with ranges): that belongs to the model (§2).
- Every writing serializer inherits **`ModelRulesMixin`** (`apps.core.serializers`), placed **before** `ModelSerializer`. It builds the record as it would be after the write and runs
  `full_clean()`: field validators, `clean()`, constraints (including conditional unique ones) and uniqueness; failures come back as a 400 with the model's messages, on the model's fields.
- Explicit `fields` tuples (never `"__all__"`); ids and timestamps in `read_only_fields`; generic `ModelSerializer[Model]`; `@final class Meta`.
- Read-only related data via nested read-only serializers (`person_detail`, `unit_people`).
- A serializer may only add shape-level checks that are **not domain rules** (for example "this key is required in this payload"); if in doubt it is a business rule: put it in the model.

### Nested serializers (parent writes its 1:1 parts)
```python
@transaction.atomic
def create(self, validated_data):
    contract = validated_data.pop("administration_contract", None)
    obj = Parent.objects.create(**validated_data)
    if contract: Contract.objects.create(parent=obj, **contract)
    return obj

@transaction.atomic
def update(self, instance, validated_data):
    contract = validated_data.pop("administration_contract", None)
    ... set attrs, instance.save() ...
    if contract: Contract.objects.update_or_create(parent=instance, defaults=contract)   # defaults=, never **contract
    return instance
```
- The nested serializer is a `ModelRulesMixin` serializer too (its parent FK is excluded because it is absent); the parent's mixin ignores nested dicts. A nested object is validated
  **as a complete record** (a partial nested PATCH must send the fields its rules depend on).
- Pop nested keys **before** touching the instance; `transaction.atomic`; `defaults=` in `update_or_create`.
- Documents with their own uniqueness (person CPF/CNPJ): the parent builds the candidate from the existing row and runs `run_model_rules` (see `PersonSerializer`), so the record's own
  value is not reported as a duplicate.
- Child **collections** (many rows) are separate endpoints, not nested writes.

## 4. Views (`views/<entity>_views.py`)
```python
@final
class UnitViewSet(viewsets.ModelViewSet[Unit]):
    queryset = Unit.objects.select_related("condominium", "block").prefetch_related("unit_people__person__people_individual")
    serializer_class = UnitSerializer
    filter_backends = (DjangoFilterBackend, QuerySearchFilter)
    search_fields = ("name", "registration_number")
    filterset_fields = ("condominium", "block", "active", "type", "is_billing_blocked")
```
- `@final`; tuples for `filter_backends`/`search_fields`/`filterset_fields`; `select_related`/`prefetch_related` for everything serializers read (no N+1).
- Permissions: rely on the global default (`IsAuthenticated`); do not repeat it per view.
- Derived filters → `filters.py` `FilterSet` with `filterset_class`.
- Non-model endpoints: `APIView` + `@extend_schema` + a documentation `Serializer`.

## 5. URLs
Each app: `urls.py` with `DefaultRouter()` and `router.register("<plural-kebab>", ViewSet, basename="<singular-kebab>")`; `urlpatterns = router.urls`;
included in `config/urls.py` under `api/`.

## 6. Admin
`@final @admin.register(Model) class XAdmin(ModelAdmin)` from `unfold.admin`; `list_display`, `search_fields`, `list_filter`; `raw_id_fields` for FKs to large tables;
`TabularInline`/`StackedInline` for 1:1 or child rows.

## 7. Migrations
Generated with `makemigrations`; reviewed (dependencies, extensions, data). Never edit an applied migration; add a new one. Pre-production the history was reset
once (one `0001` per app); from now on keep history. Data migrations: `RunPython` with reverse, idempotent. CI fails on missing migrations.

## 8. Management commands
`management/commands/<name>.py`, `@final class Command(BaseCommand)`; idempotent; destructive options explicit (`--clear`); wrap in `transaction.atomic`.

## 9. Typing and style
Python 3.12 typing (`typing.override`, `typing_extensions.final`), annotate public functions, avoid `Any` unless DRF `validated_data`/`attrs`. `mypy` config exists
(strict + plugins) but is not enforced yet; do not add new obviously untyped code. Formatting: black-like, 88–100 cols, no unused imports.

## 10. Tests
See `architecture/quality/testing.md`. Each rule: a model test (`clean()`/validator, no DB) + a DB constraint test + one API/serializer test proving the 400; payloads in the frontend's exact shape; no order dependence.

## 11. Git
English commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`. One logical change per commit. Feature work references its spec (`docs/features/NNN-*.md`).

## 12. Before finishing a change
- [ ] Spec exists/updated for features; open questions asked and answered
- [ ] Every business rule is in the model (validator / `clean()` / constraint); serializers only use `ModelRulesMixin`; ordering and `select_related` set
- [ ] Migration generated (`makemigrations --check` clean); data migration idempotent if present
- [ ] Tests added and `pytest` passes on PostgreSQL; `manage.py check` clean
- [ ] `docs/apps/<app>.md` (and `known-gaps.md`) updated; user told if the frontend client must be regenerated
