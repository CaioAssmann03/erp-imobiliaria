---
summary: Pattern book (naming lives in conventions/naming.md): rules only in models, errors, querysets, rules classes, services, serializers, views, migrations, comments, tests.
read-when: you write or review any backend code
skip-if: only deciding where a file goes → architecture/structure.md; only business formulas → architecture/data.md; only running commands → architecture/operations.md
---
# Practices — follow the pattern the project already uses

## 1. Language and naming
**Read `conventions/naming.md` before naming anything.** Code, comments, docs and API field names are **English**; API error messages are English (the frontend maps them to Portuguese). Files `snake_case.py`, one model per file; serializers `<entity>_serializers.py`, views `<entity>_views.py`; classes `PascalCase` (`<Entity>ViewSet`, `<Entity>Serializer`, `<Entity>Filter`). URL resources plural kebab-case, router basename singular. Constraint names `<model>_<rule>`. Demo data may be Portuguese.

## 2. Business rules live ONLY in the models
A business rule is anything the domain says must be true. **Write it in the model, and only there.** Serializers, views, services and tasks hold no rule; they call the model.

| Kind of rule | Where in the model | Example |
|---|---|---|
| One field's value (range, format) | a **validator** on the field (functions in `validators.py`) | `validate_due_day`, `validate_cpf` |
| Several fields, or other records | `clean()` raising `ValidationError({"field": ...})` on the field the user must fix; with **two or more** rules, `clean()` only calls a rules class (below) | `UnitPersonRules`, `AccountPayableRules` |
| Uniqueness, exclusion, last line of defence | `Meta.constraints` with `violation_error_message` and `violation_error_code` | `unit_person_unique_active_link` |
| A calculation or behaviour the domain owns | a **model or queryset method** | `next_adjustment_date()`, `UnitPerson.objects.current()` |

- A rule that matters is written **twice in the model**: `clean()`/validator (a clear 400 in the API and admin) **and** a constraint (the database refuses it even if code skips validation). They share one member of the entity's error enum, so message and code are identical.
- Models do **not** call `full_clean()` on `save()`; entry points that must validate call it: the admin form, serializers (through `ModelRulesMixin`), and services, commands and tasks before they `save()`. `clean()` may read the database but never touches the network.
- SQL `CHECK (x >= 0)` accepts NULL: add `Q(x__isnull=False)` if NULL must fail (and check it in `clean()`).

**Errors** live in `apps/<app>/errors/<entity>.py`, one `RuleError` enum per entity (`core/errors/base.py`); a member is `NAME = ("model.field.reason", "English message.")`. The model never writes a message or a code: validators and `clean()` raise `Error.NAME.to_validation_error()` (`errors["field"] = ...` inside `clean()`); constraints set `violation_error_message=Error.NAME.message, violation_error_code=Error.NAME.value` (pass `.value`, never the member: migrations hold plain strings). A new model creates its `errors/<entity>.py` and exports it in `errors/__init__.py`; the frontend then needs the Portuguese text in `lib/error-messages.ts` (the compile fails until it exists). Guard tests (`core/tests/errors/test_error_codes.py`) fail for a constraint or `ValidationError(` without a code, or an error without an English message.

**Querysets** go in `models/querysets/<entity>.py` (`XxxQuerySet(models.QuerySet)`, re-exported by the package), never in the model file; the model sets `objects = XxxQuerySet.as_manager()`. The module must not import the model at runtime (cycle): reach it through `self.model` (`self.model.Status.OPEN`), and import it only under `if TYPE_CHECKING:` for the string generic argument (`models.QuerySet["Unit"]`) with `# noqa: F401`: ruff does not count a string as a use, and `ruff --fix` would delete the import. Constants used only by the queryset live in its file. Views, the dashboard included, only call these methods and shape the response.

### Rules classes (`models/rules/<entity>.py`)
When a model's `clean()` would hold two or more rules, they move to `<Entity>Rules(ModelRules["<Entity>"])` (`core/models/rules.py`) and `clean()` becomes `<Entity>Rules(self).validate()`. The rules stay the model's: it is the only caller.
- **One method per rule**, named as a question that is true when the rule is **violated** (`owner_lacks_percentage`), decorated with `@rule("field", Error.MEMBER)`. The method holds the condition only; it never builds an error.
- Rules run **in the order written; the first violated rule of a field wins**, and a rule whose field already has an error is not evaluated (a rule that queries the database only runs when it can still matter).
- Pure calculations the rules need live in the same file. Reach the model class through `type(self.instance)`; import it only under `TYPE_CHECKING` with `# noqa: F401`, as the querysets do.
- Not for a model with a single rule (`Supplier`, `CostCenter`...). A precondition that is not about one field (a closed `AccountPayable` never changes) stays in `clean()`, before `Rules(self).validate()`.

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
- Inherit `BaseModel` (id + `created_at` + `updated_at`) or `UUIDModel` (the id only) from `core/models/base.py`; never declare those fields. `@final` on the concrete class, `@override` on dunders and `clean`.
- `Meta.constraints` is **always a tuple**; `Meta.ordering` on anything the API lists (stable pagination).
- `null=True` only when "unknown" differs from "empty"; optional text uses `blank=True`. Enums are nested `TextChoices` with English values and labels.
- Related-manager and `_id` type hints go under `if TYPE_CHECKING`. Document validators come from `core/validators`; documents are stored digits-only.

## 3. Serializers (`serializers/<entity>_serializers.py`)
```python
class BlockSerializer(ModelRulesMixin, serializers.ModelSerializer[Block]):
    @final
    class Meta:
        model = Block
        fields = ("id", "condominium", "name")
        read_only_fields = ("id",)
```
- A serializer describes the **API shape** only: `fields`, `read_only_fields`, nested serializers. No `validate` with domain logic, no `validate_<field>` with ranges: that is the model's (§2). It may add shape-level checks that are not domain rules ("this key is required in this payload"); if in doubt, it is a rule.
- Every writing serializer inherits **`ModelRulesMixin`** (`core/serializers`), **before** `ModelSerializer`: it builds the record as it would be after the write and runs `full_clean()`, so failures come back as a 400 with the model's messages on the model's fields.
- Explicit `fields` tuples (never `"__all__"`); ids and timestamps `read_only`; related data as read-only nested serializers (`person_detail`).

### Nested writes
The serializer validates (nested serializers are `ModelRulesMixin` serializers too, the parent FK excluded) and hands the validated data to a service (§3b); it does not write the children itself: `create` returns `create_condominium(request_company(self), validated_data)`. A nested object is validated **as a complete record** (a partial nested PATCH sends the fields its rules depend on). Documents with their own uniqueness (person CPF/CNPJ): the parent builds the candidate from the existing row and runs `run_model_rules` (see `PersonSerializer`), so the record's own value is not reported as a duplicate. Child **collections** are separate endpoints; the one exception is a billing plan's `items`, written with the plan and replaced as a whole (spec 024, `apps/billing.md`).

## 3b. Services (`services/<use_case>.py`)
A **service is one use case**: a function that orchestrates several models or a transaction (`create_condominium`, `settle_account_payable`). It exists only where plain CRUD is not enough: a `create` that just adds the company stays in the serializer.
- **One file per use case**; the file and the function share one verb-first name. `services/__init__.py` stays empty and callers import the module (re-exporting would let the function shadow its module).
- A service **holds no business rule**: it opens `transaction.atomic`, locks, calls the models' methods, assigns the transition and runs `full_clean()` so the model refuses what is invalid. It never raises a `ValidationError` of its own (`core/tests/architecture/test_services_layout.py` fails if it does); a rule it needs is a model method (`AccountPayable.lock_for_change()`).
- Parameters are domain objects, never the request (the serializer passes `request_company(...)`); more than three values travel in a small frozen dataclass in the service file (`AccountPayablePayment`). It returns the saved instance.
- Reads (the dashboard) are not services: they are queryset methods called by the view. Tests call the service directly for the transaction (rollback) and through the API for the whole path.

## 4. Views (`views/<entity>_views.py`)
`@final` viewset with `queryset` (`select_related` / `prefetch_related` for everything serializers read), `serializer_class`, tuples for `filter_backends`, `search_fields`, `filterset_fields`; derived filters in `filters.py` (`filterset_class`). Permissions come from the global default (`IsAuthenticated`); do not repeat it. Non-model endpoints: `APIView` + `@extend_schema` + a documentation `Serializer`.

## 5. URLs · 6. Admin · 7. Migrations · 8. Commands
- **URLs:** each app has `urls.py` with `DefaultRouter()` and `router.register("<plural-kebab>", ViewSet, basename="<singular-kebab>")`, included in `config/urls.py` under `api/`.
- **Admin:** `@final @admin.register(Model) class XAdmin(ModelAdmin)` from `unfold.admin`; `raw_id_fields` for FKs to large tables; inlines for 1:1 or child rows.
- **Migrations:** generated and reviewed (dependencies, extensions, data). Never edit an applied one; add a new one. Data migrations: `RunPython` with a reverse, idempotent. CI fails on a missing one.
- **Commands:** `@final class Command(BaseCommand)`, idempotent, destructive options explicit (`--clear`), wrapped in `transaction.atomic`.

## 9. Typing, style and comments
Python 3.12 typing (`typing.final`, `typing.override`), annotate public functions, avoid `Any` unless DRF `validated_data`/`attrs`. Formatting: black-like, 88–100 columns, no unused imports.

**Comments and docstrings only where the code cannot explain itself.** If a name needs a comment, rename it. Write one for a **reason** (why this way), a **constraint or side effect** the code does not show (`clean()` fills `company` when absent; the address is updated in place, never replaced), a **format or unit** (`# days`), a domain term or old name (the PDF's *SubConta*), or a **non-obvious return**. Do not write one that restates the name or the next line, a section divider (`# ----- rules -----`), the same note on every model, a framework boilerplate docstring, or a plan for later (that belongs in the roadmap). Docstrings of DRF views and serializers become the OpenAPI description: write them for the API reader, never about internals. Tests keep their `spec NNN, Rn` line (traceability; the requirements are in `features/history.md`). `# noqa` and `# type: ignore` need their reason next to them when it is not obvious.

## 10. Tests
See `architecture/quality.md`. Each rule: a model test (`clean()`/validator, no DB) + a DB constraint test + one API/serializer test proving the 400.

## 11. Git
English commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`. One logical change per commit.

## 12. Before finishing a change
- [ ] Spec exists or is updated for a feature; open questions asked and answered
- [ ] Every rule is in the model; serializers only use `ModelRulesMixin`; ordering and `select_related` set
- [ ] Migration generated (`makemigrations --check` clean); data migration idempotent if present
- [ ] Tests added and `pytest` passes on PostgreSQL; `manage.py check` clean
- [ ] `docs/apps/<app>.md` updated; the user told if the frontend client must be regenerated (and its dev server restarted)
