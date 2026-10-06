---
summary: Pattern book (naming rules live in conventions/naming.md): business rules only in models, serializers with ModelRulesMixin, views, urls, admin, migrations, commands, tests.
read-when: you write or review any backend code
skip-if: only deciding where a file goes → architecture/structure.md; only business formulas → architecture/data.md; only running commands → architecture/operations.md
---
# Practices — follow the pattern the project already uses

## 1. Language and naming
**Names follow Clean Code: read `conventions/naming.md` before naming anything** (intention-revealing, no abbreviations, verbs for methods, `reference_date` instead of `on`, no flag arguments, ≤ 3 parameters).
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
| Several fields of the same record, or other records | `clean()` raising `ValidationError({"field": ...})` (target the field the user must fix). With **two or more** such rules, `clean()` only calls a rules class (below) | `AdministrationContractRules`, `UnitPersonRules`, `AccountPayableRules` |
| Involves another record | `clean()` (reads related objects) | `UnitRules.block_belongs_to_another_condominium` |
| Uniqueness, exclusion, last line of defence | `Meta.constraints` (`UniqueConstraint`, `CheckConstraint`) with `violation_error_message` and `violation_error_code` | `unit_person_unique_active_link` |
| Derived value or behaviour the domain owns | a **model method / property** (`def current_links(self)`, `def next_adjustment_date(self)`) | add methods here, not in views |

- A rule that matters is usually written **twice inside the model**: `clean()`/validator (clear message, 400 in the API and admin) **and** a constraint (the database refuses it
  even if code skips validation). Both live in the same file; keep their messages **and codes** identical (they share one member of the entity's `errors/<entity>.py` enum).
- **Every rule carries a stable code and its message, declared together** (spec 006). They live in `apps/<app>/errors/<entity>.py`, one `RuleError` enum per entity (`apps/core/errors/base.py`); a member is `NAME = ("model.field.reason", "English message.")`. The model never writes a message or a code: validators and `clean()` raise `Error.NAME.to_validation_error()` (a `clean()` wraps it per field: `errors["field"] = Error.NAME.to_validation_error()`), constraints set `violation_error_message=Error.NAME.message, violation_error_code=Error.NAME.value` (pass `.value`, never the enum member: migrations must hold plain strings). Add the member to the entity's file (create `errors/<entity>.py` and export it in `errors/__init__.py` for a new model); the frontend then needs its Portuguese text in `lib/error-messages.ts` (the compile fails until it exists). Guard tests (`apps/core/tests/test_error_codes.py`) fail for a constraint or `ValidationError(` without a code, or an error without an English message.
- Models do **not** call `full_clean()` on `save()` (Django does not); entry points that must be validated call it: the admin form does automatically, serializers do through
  `ModelRulesMixin` (§3), commands/tasks that write data call `instance.full_clean()` before `save()`.
- `clean()` must not touch the network or send mail; it may read the database (related rows).
- SQL `CHECK (x >= 0)` accepts NULL: add `Q(x__isnull=False)` if NULL must fail (and check it in `clean()`).
- Calculations and the **rules** of a state transition (what is allowed, the row lock) belong to **model methods or queryset methods**, so every caller reuses them; the use case that performs the transition is a service (§3b). Existing examples: `AdministrationContract.next_adjustment_date()` /
  `is_adjustment_overdue(reference_date)`, `UnitPerson.objects.current(reference_date)`, `Unit.objects.inconsistent_apportionment_condominium_ids()`, helper `core.dates.add_months`.
  Views (the dashboard included) only call them and shape the response. Queryset methods go in a `XxxQuerySet(models.QuerySet)` in `models/querysets/<entity>.py` (re-exported by `models/querysets/__init__.py`), never in the model file; the model sets `objects = XxxQuerySet.as_manager()`. The queryset module must not import the model at runtime (cycle): reach the model through `self.model` (`self.model.Status.OPEN`) and use `TYPE_CHECKING` only for the type (`models.QuerySet["Unit"]` needs `from ...unit import Unit` under `if TYPE_CHECKING:` with `# noqa: F401`: ruff does not see a string generic argument as a use, and `ruff --fix` would delete the import and leave an empty block); constants used only by the queryset live in its file.

### Rules classes (`models/rules/<entity>.py`)
When a model's `clean()` would hold two or more rules, they move to a `<Entity>Rules(ModelRules["<Entity>"])` class (`apps/core/models/rules.py`) and `clean()` becomes `<Entity>Rules(self).validate()`.
The rules stay the model's: it is the only caller, and the class lives inside `models/`.
- **One method per rule**, named as a question that is true when the rule is **violated** (`owner_lacks_percentage`, `ends_before_it_starts`), decorated with `@rule("field", Error.MEMBER)`: the field the user must fix and the
  `errors/<entity>.py` member to report. The method holds the condition only; it never builds an error.
- The rules run **in the order they are written; the first violated rule of a field wins**, and a rule whose field already has an error is not evaluated (a rule that queries the database only runs when it can still matter).
- Pure calculations the rules need (`OwnershipPeriod`) live in the same file. Reach the model class through `type(self.instance)` (importing it would be a cycle); the model is imported only under `if TYPE_CHECKING:` with `# noqa: F401` for the string generic argument (`ModelRules["Unit"]`), same as the querysets.
- Existing classes: `UnitPersonRules`, `UnitRules`, `AdministrationContractRules` (`condominiums`), `AccountPayableRules` (`finance`). Not for a model with a single rule (`Supplier`, `CostCenter`, `BankAccount`...): keep it in `clean()`.
- A precondition that is not about one field (a closed `AccountPayable` never changes) stays in `clean()`, before `Rules(self).validate()`: the base reports errors per field only. The constraint that mirrors a rule stays in `Meta.constraints`, as before.
- Tests: `apps/core/tests/test_model_rules.py` covers the base; each model's behavior stays covered through its own tests.

## 2b. Models (`models/<entity>.py`)
```python
@final
class Block(UUIDModel):  # BaseModel when it also has created_at/updated_at
    condominium = models.ForeignKey(Condominium, on_delete=models.CASCADE, related_name="blocks")
    name = models.CharField(max_length=60)

    class Meta:
        verbose_name = "Block"
        verbose_name_plural = "Blocks"
        ordering = ("name",)
        constraints = (
            models.UniqueConstraint(fields=("condominium", "name"), name="block_unique_name_per_condominium",
                                    violation_error_message=BlockError.NAME_DUPLICATE_IN_CONDOMINIUM.message,
                                    violation_error_code=BlockError.NAME_DUPLICATE_IN_CONDOMINIUM.value),
        )

    @override
    def __str__(self) -> str: return f"Block {self.name} of {self.condominium}"
```
- Inherit `BaseModel` (UUID `id` + `created_at` + `updated_at`) or `UUIDModel` (only the `id`) from `apps/core/models/base.py`: never declare those fields in the model. `@final` (`typing_extensions`) on the concrete class, `@override` on dunder/`clean`.
- `Meta.constraints` is **always a tuple**, even with one item; every constraint has `name` (+ `violation_error_message` and `violation_error_code`, from the entity's `errors/` enum).
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
The serializer validates (nested serializers are `ModelRulesMixin` serializers too, parent FK excluded because it is absent) and hands the validated data to a **service** (§3b); it
does not write the children itself:
```python
def create(self, validated_data):
    return create_condominium(request_company(self), validated_data)

def update(self, instance, validated_data):
    return update_condominium(instance, validated_data)
```
- A nested object is validated **as a complete record** (a partial nested PATCH must send the fields its rules depend on); the parent's mixin ignores nested dicts.
- Documents with their own uniqueness (person CPF/CNPJ): the parent builds the candidate from the existing row and runs `run_model_rules` (see `PersonSerializer`), so the record's own
  value is not reported as a duplicate.
- Child **collections** (many rows) are separate endpoints, not nested writes.

## 3b. Services (`services/<use_case>.py`)
A **service is one use case**: a function that orchestrates several models or a transaction (`create_condominium`, `settle_account_payable`). It exists only where plain CRUD is not enough.
- **One file per use case**; the file and the function have the same verb-first name (`settle_account_payable.py` → `settle_account_payable`). `services/__init__.py` stays empty and callers import
  the module (`from ..services.settle_account_payable import settle_account_payable`): re-exporting would let the function shadow its own module.
- A service **holds no business rule**. It opens `transaction.atomic`, locks, calls the models' methods, assigns the transition and runs `full_clean()` so the model refuses what is invalid; it never
  raises a `ValidationError` of its own (a guard test, `apps/core/tests/test_services_layout.py`, fails if it does). A rule that a service needs is a method of the model (`AccountPayable.lock_for_change()`).
- Parameters are domain objects, never the request: the serializer or view calls `request_company(...)` and passes the company; more than three values travel in a small frozen dataclass
  defined in the service file (`AccountPayablePayment`). The service returns the saved instance.
- Serializers and views only parse input, call the service and shape the response. Plain CRUD (`create` that just adds the company) stays in the serializer: a service is not a wrapper for `save()`.
- Reads (the dashboard) are not services: they are queryset methods called by the view.
- Tests call the service directly for the transaction (rollback) and through the API for the whole path.

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

**Comments and docstrings only where the code cannot explain itself.** If a name needs a comment, rename it (`naming.md`). Write one for a **reason** (why this way, why not the obvious way), a **constraint or
side effect** the code does not show (`clean()` fills `company` when absent; the address is updated in place, never replaced), a **format or unit** (`# days`), a domain term or old name (the PDF's *SubConta*), or a
**non-obvious return** ("returns (units, links) created"). Do not write one that restates the name or the line below it, a section divider (`# ----- rules -----`), the same note on every model (the
`company_lookup` pointer), a framework boilerplate docstring, or a plan for later (it belongs in the roadmap). Docstrings of DRF views and serializers become the OpenAPI description (and the generated client's
comments): write them for the API reader, never about internals. Test files keep their `spec NNN, Rn` line: it is the traceability the code does not carry. `# noqa` and `# type: ignore` are directives, not
comments, but each needs its reason next to it when it is not obvious.

## 10. Tests
See `architecture/quality.md`. Each rule: a model test (`clean()`/validator, no DB) + a DB constraint test + one API/serializer test proving the 400; payloads in the frontend's exact shape; no order dependence.

## 11. Git
English commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`. One logical change per commit. Feature work references its spec (`docs/features/NNN-*.md`).

## 12. Before finishing a change
- [ ] Spec exists/updated for features; open questions asked and answered
- [ ] Every business rule is in the model (validator / `clean()` / constraint); serializers only use `ModelRulesMixin`; ordering and `select_related` set
- [ ] Migration generated (`makemigrations --check` clean); data migration idempotent if present
- [ ] Tests added and `pytest` passes on PostgreSQL; `manage.py check` clean
- [ ] `docs/apps/<app>.md` (and `known-gaps.md`) updated; user told if the frontend client must be regenerated
