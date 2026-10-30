---
summary: Spec 063 — the Django Admin sidebar is grouped in Portuguese and a new page, Arquivados, lists the deleted records of every archivable model with a restore button (and the LGPD anonymization of persons).
read-when: you change the Admin sidebar, add an archivable model, or touch the Arquivados page
skip-if: what archiving is and its rules → features/062-soft-delete-archiving.md; how to open the Admin on the VPS → architecture/operations.md
---
# 063 — Admin organization and the Arquivados page

**Status:** done · **Level:** lite · **Roadmap:** none · **Apps:** core (settings, admin) · **Frontend impact:** none

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-30 | "Admin area" is the Django Admin (Unfold); the restore screen lives there, as a page of its own, not as a screen of the frontend | user (asked for the restore screen in the admin area) |
| 2026-10-30 | The sidebar is written by hand in Portuguese, grouped as Cadastros, Financeiro, Cobrança and Sistema, with every registered model listed so none is unreachable | agent, to be confirmed |
| 2026-10-30 | The Arquivados page is generic: it lists every model whose Admin uses `SoftDeleteAdminMixin`, so a new archivable model appears without touching the page | agent, to be confirmed |
| 2026-10-30 | The Admin takes the colors of the site: the orange `#f05a28` as the primary color and the site's warm neutrals as the base (so the light and dark modes match the app), plus the 0.75rem radius of the site's controls (`apps/core/static/admin/metri.css`) | user |
| 2026-10-30 | The Admin home is a page of cards, one per sidebar group, with the number of deleted records on the Arquivados card; the gateway tables (registrations, deliveries, payments, PDFs, account, customers, events, reconciliations) move to a collapsed group, "Gateway e boletos (técnico)" | agent, to be confirmed |
| 2026-10-30 | The model screens of the Admin (lists and forms) are cleaned too: a shared base (`MetriModelAdmin`) gives compact forms, filters in a side sheet, an unsaved-changes warning and Portuguese field labels and list headers; the main forms are split in tabs and sections; the database-filled code is left out of the add form | user (asked for the model screens to be cleaned) |
| 2026-10-30 | Anonymize (spec 062) is also a button of the page, for persons, superuser only | agent, to be confirmed |

## R — Requirements
The Admin has one flat list of 35 models, in English; the deleted records of spec 062 are reachable only through a filter on each list. Outcome: a grouped sidebar and one page to find and restore what was deleted.
- [x] R1 — the sidebar groups the models in Cadastros, Financeiro, Cobrança, Gateway e boletos (técnico) and Sistema and links the Arquivados page
- [x] R2 — every model registered in the Admin has a sidebar item (a guard test fails when a new one is not listed)
- [x] R3 — the Arquivados page lists, per archivable model, the deleted records of the user's company, newest deletion first, with a search
- [x] R4 — the restore button restores the record or shows the coded refusal (for example a name taken meanwhile); it changes nothing else
- [x] R6 — the Admin uses the orange and the neutrals of the site in both modes, and its home shows a card per group with the deleted count
- [x] R7 — every Admin list and add form renders with the shared base (Portuguese labels and headers, tabs on the main forms) and the Condominium and Person add forms no longer break on the code
- [x] R5 — the page is for staff with the change permission of the model; anonymizing a person is for superusers only and shows the model's refusal inside the retention period

## E — Entities
`No schema change.`

## S — Structure
`config/settings.py` (`UNFOLD` `SIDEBAR`, `COLORS`, `STYLES`, `DASHBOARD_CALLBACK`), `apps/core/infrastructure/admin_home.py`, `apps/core/static/admin/metri.css`, `config/templates/admin/index.html`, `apps/core/infrastructure/archived_admin.py` (the view), `apps/core/templates/admin/archived_records.html`, `config/urls.py` (`<ADMIN_URL>archived/`). `GET <ADMIN_URL>archived/?type=<app.model>&q=` lists; `POST <ADMIN_URL>archived/` with `action=restore|anonymize`, `model` and `pk` acts and redirects back with a message.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/core/tests/test_admin_sidebar.py::test_the_sidebar_is_grouped_and_links_the_archived_page` |
| R2 | `apps/core/tests/test_admin_sidebar.py::test_every_registered_model_has_a_sidebar_item` |
| R3 | `apps/core/tests/test_archived_page.py::test_the_page_lists_the_deleted_records_of_the_company` |
| R4 | `apps/core/tests/test_archived_page.py::test_restore_brings_a_record_back`, `apps/core/tests/test_archived_page.py::test_a_refused_restore_is_a_message` |
| R5 | `apps/core/tests/test_archived_page.py::test_anonymize_is_for_superusers_only` |
| R7 | `apps/core/tests/test_admin_screens.py::test_every_list_renders`, `apps/core/tests/test_admin_screens.py::test_every_add_form_renders`, `apps/core/tests/test_admin_screens.py::test_the_condominium_form_has_tabs_and_portuguese_labels`, `apps/core/tests/test_admin_screens.py::test_a_list_shows_portuguese_headers_and_yes_no_icons` |
| R6 | `apps/core/tests/test_admin_sidebar.py::test_the_admin_uses_the_orange_of_the_site`, `apps/core/tests/test_admin_sidebar.py::test_the_home_shows_a_card_per_group_and_the_archived_count`, `apps/core/tests/test_admin_sidebar.py::test_the_admin_loads_the_theme_stylesheet` |

## Definition of done
- [x] Every criterion R1… has a passing test; `pytest apps -q` green; `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes; client regenerated (or `N/A — no API change`)
- [x] `docs/apps/core.md` and `architecture/operations.md` updated; roadmap part/phase and the spec index updated (if applicable)
