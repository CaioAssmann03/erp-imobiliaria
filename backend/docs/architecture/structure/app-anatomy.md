---
summary: Standard layout of an app, the re-export rule and the steps to create a new app.
read-when: you create or restructure an app
skip-if: code patterns → practices.md; task recipes → architecture/structure/extending.md
---
# Anatomy of an app

```
apps/<app>/
  __init__.py
  apps.py                  @final AppConfig, name = "apps.<app>"
  admin.py                 unfold ModelAdmin / TabularInline
  models/                  package, one entity per file; __init__.py re-exports (X as X)
  serializers/             package, <entity>_serializers.py; __init__.py re-exports
  views/                   package, <entity>_views.py (ViewSets); __init__.py re-exports
  filters.py               only when a FilterSet is needed (custom filters)
  urls.py                  DefaultRouter; included by config/urls.py
  migrations/              generated; never edited after being applied
  tests/                   __init__.py, base.py, conftest.py, test_*.py
```
Apps without an API (e.g. `accounts`, `financeiro` today) simply omit `serializers/`, `views/`, `urls.py`.

## Create a new app
1. `mkdir apps/<app> && python manage.py startapp <app> apps/<app>`; delete the generated `models.py`, `views.py`, `tests.py`
   (the project uses packages and a `tests/` folder).
2. `apps.py`: `@final class XxxConfig(AppConfig): name = "apps.<app>"`.
3. Add `"apps.<app>"` to `INSTALLED_APPS` (after the apps it depends on).
4. Create `models/`, then `serializers/`, `views/`, `urls.py`, `admin.py`, `tests/` as needed (see `practices.md`).
5. Include the urls in `config/urls.py` (`path("api/", include("apps.<app>.urls"))`).
6. `python manage.py makemigrations <app>`; check the migration dependencies make sense.
7. Write `docs/apps/<app>.md` (apps get their doc **when they start**, not before) and add it to `docs/README.md` and the `AGENTS.md` map.
   Apps that are still empty stubs (`cobranca`, `locacoes`, `vendas`) are first restructured to this layout by their first feature.
Before all of this: a feature spec (`docs/features/`).

## Re-export rule
`models/__init__.py` imports each model as `from .x import X as X`; same for serializers and views. Other code imports from the package
(`from apps.condominiums.models import Unit`); inside the app, import from the concrete module to avoid import cycles
(`from apps.condominiums.models.condominium import Condominium`).
