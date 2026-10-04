---
summary: Pattern book: how models, serializers, views, urls, admin, migrations, commands and tests are written in this project.
read-when: you write or review any backend code
skip-if: only deciding where a file goes → architecture/structure/app-anatomy.md; only business formulas → architecture/data/domain-rules.md; only running commands → architecture/operations/local-dev.md
---
# Practices — follow the pattern the project already uses

## 1. Language and naming
- Code, comments, docs and API field names in **English**; API error messages in English (the frontend maps them to Portuguese).
- Files: `snake_case.py`; model file = entity (`unit_person.py`); serializers `<entity>_serializers.py`; views `<entity>_views.py`.
- Classes: `PascalCase`; ViewSets `<Entity>ViewSet`; serializers `<Entity>Serializer`; filters `<Entity>Filter`.
- URL resources plural kebab-case; router basename singular kebab-case. Constraint names `<model>_<rule>` (e.g. `unit_person_owner_percentage`).
- Demo/seed data may be Portuguese (it is sample content).

## 2. Models (`models/<entity>.py`)
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
- `Meta.constraints` is **always a tuple**, even with one item; every constraint has `name` (+ `violation_error_message` for rules).
- `null=True` only when "unknown" differs from "empty"; text fields that are optional use `blank=True` (+ `null=True` only if the API must accept `null`).
- Enums: nested `models.TextChoices` with English values; display labels in English (UI translates).
- Related-manager and `_id` hints for type checkers: `if TYPE_CHECKING: units: "RelatedManager[Unit]"; condominium_id: uuid.UUID`.
- Validators from `apps.core.validators` for CPF/CNPJ; store documents digits-only.
- SQL `CHECK (x >= 0)` accepts NULL: add `Q(x__isnull=False)` if NULL must fail.
- Cross-model rule that cannot be a constraint (e.g. block belongs to condominium) → `clean()` **and** the serializer `validate`.
- `Meta.ordering` on anything listed by the API (stable pagination).

## 3. Serializers (`serializers/<entity>_serializers.py`)
```python
class BlockSerializer(serializers.ModelSerializer[Block]):
    @final
    class Meta:
        model = Block
        fields = ("id", "condominium", "name")
        read_only_fields = ("id",)
```
- Explicit `fields` tuples (never `"__all__"`); ids and timestamps in `read_only_fields`.
- Generic `ModelSerializer[Model]`; `@final class Meta`.
- **Mirror every `CheckConstraint`** in `validate` (DRF does not run them) using the same message; unconditional uniqueness is handled by DRF validators,
  conditional uniqueness is not (the DB raises `IntegrityError` → add a check or accept as 500-risk only if impossible to validate).
- `validate(attrs)` merges with `self.instance` values for PATCH (`{**self.instance.__dict__, **attrs}`) when the rule needs fields not sent.
- Read-only related data via nested read-only serializers (`person_detail`, `unit_people`).

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
- Pop nested keys **before** touching the instance; wrap in `transaction.atomic`; use `defaults=` in `update_or_create`.
- Nested serializers exclude the parent FK (`exclude = ("condominium",)` / only data fields) and drop unique validators that would reject the instance's own value
  (check uniqueness in the parent `validate`, excluding `self.instance`).
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
See `architecture/quality/testing.md`. Each rule: serializer test + DB constraint test; API tests with the frontend's exact payload; no order dependence.

## 11. Git
English commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`. One logical change per commit. Feature work references its spec (`docs/features/NNN-*.md`).

## 12. Before finishing a change
- [ ] Spec exists/updated for features; open questions asked and answered
- [ ] Models/serializers/views follow sections 2–5; rules mirrored in serializers; ordering and `select_related` set
- [ ] Migration generated (`makemigrations --check` clean); data migration idempotent if present
- [ ] Tests added and `pytest` passes on PostgreSQL; `manage.py check` clean
- [ ] `docs/apps/<app>.md` (and `known-gaps.md`) updated; user told if the frontend client must be regenerated
