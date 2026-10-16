---
summary: Spec: a Google Maps map (Maps Embed API) under the condominium address, fed by the address fields (so the CEP lookup brings it), with an "Abrir no Maps" link when no key is configured.
read-when: you touch the address section of the condominium form, GOOGLE_MAPS_EMBED_KEY, or the CSP frame-src
skip-if: the CEP lookup itself (ViaCEP) → frontend `hooks/use-cep-lookup.ts`; security headers and CSP → frontend `docs/safeguards/http-hardening.md`; late-payment rules and fractions → features/020-late-payment-rules-and-fractions.md
---
# 021 — Address map (Google Maps)

**Status:** in-progress · **Level:** full · **Roadmap:** none · **Apps:** frontend only (no backend change) · **Frontend impact:** new screens

## Open questions
(none)

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-16 | The map is Google Maps through the **Maps Embed API**, like the Sami's (an iframe with Google's map and an "Abrir no Maps" link); the user creates the Google key | the user |
| 2026-10-16 | The key is read **on the server at request time** from `GOOGLE_MAPS_EMBED_KEY` (no `NEXT_PUBLIC_` prefix) by the two condominium pages and handed to the form as a prop: a new key needs a restart, not a rebuild | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | Without a key only the "Abrir no Maps" link is shown (Google Maps URLs need no key); the link is also shown under the map | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | The map is for a **condominium's** address only. A person's address would be sent to Google; reusing it for people needs its own decision | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | The place query is the address text (street, number, district, city, state, CEP, "Brasil"): Google locates it, so no coordinates are fetched or stored and nothing changes in the API | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | It sits under the fields of the Address section (new and edit pages), needs a CEP of 8 digits or a street and a city, and follows the fields 600 ms after the user stops typing: typing a CEP fills the address (existing ViaCEP lookup) and the map follows | agent; confirmed by the user on 2026-10-16 |
| 2026-10-16 | The CSP of `http-hardening.md` is still only recommended; its template gains `frame-src https://www.google.com` so adopting it does not hide the map | agent; confirmed by the user on 2026-10-16 |

## R — Requirements
The Sami shows a map under the condominium address; here the address is only text fields.
- [ ] R1 — With `GOOGLE_MAPS_EMBED_KEY` set, the Address section of the condominium form shows Google's map of the address in the fields (new and edit pages) and follows them after a short pause; filling a CEP, which fills the street, brings the map
- [ ] R2 — Without the key the section shows only an "Abrir no Maps" link to the address; nothing else changes and nothing fails
- [ ] R3 — Nothing is shown while the address is too incomplete: it needs a CEP of 8 digits, or a street and a city
- [ ] R4 — The key is never in the repository: `.env.example`, `docker-compose.yml` and `architecture/operations.md` document `GOOGLE_MAPS_EMBED_KEY` and how to restrict the key
- [ ] R5 — The pure helpers that build the query, the embed URL and the link, and decide whether the address is complete, are tested (encoding, empty parts)
- [ ] R6 — The docs match: `http-hardening.md` (the `frame-src` line), `operations.md` (variable and a short runbook of the key), the frontend `product-scope.md` (the Condominiums row)

## E — Entities
N/A: no model, field or migration.

## A — Approach
- **An iframe, no JavaScript SDK.** `https://www.google.com/maps/embed/v1/place?key=<key>&q=<address>` (Google: the Embed API is free with unlimited use, but every request needs a key, and the Cloud project needs a billing account). The iframe is `loading="lazy"`, titled for screen readers, and `referrerpolicy="strict-origin-when-cross-origin"`, which sends the site's origin, enough for the key's referrer restriction and the policy `http-hardening.md` recommends.
- **The fallback link** is a Google Maps URL, `https://www.google.com/maps/search/?api=1&query=<address>` (documented, no key).
- **Pure helpers in `lib/maps.ts`** (`addressQuery`, `isAddressMappable`, `mapsEmbedUrl`, `mapsSearchUrl`) and a small client component that reads the form fields with `useWatch` and the shared debounce hook. The key comes from the server pages, so the client bundle never needs a build-time variable.
- **Rejected:** the Maps JavaScript API (billed per load, needs the SDK), the keyless `output=embed` URL (not supported by Google), OpenStreetMap (a different look and no nearby places; the user chose Google), storing latitude and longitude (needs geocoding and a migration).

## S — Structure
| File | Change |
|---|---|
| `frontend/lib/maps.ts` (new), `frontend/tests/maps.test.mjs` (new) | helpers and their tests |
| `frontend/app/(dashboard)/condominiums/_components/condominium-form/AddressMap.tsx` (new), `AddressSection.tsx`, `CondominiumForm.tsx` | the component, placed under the address fields; the `mapsEmbedKey` prop |
| `frontend/app/(dashboard)/condominiums/new/page.tsx`, `frontend/app/(dashboard)/condominiums/[id]/page.tsx` | read `process.env.GOOGLE_MAPS_EMBED_KEY` and pass it down |
| `.env.example`, `docker-compose.yml` (frontend service) | the variable, commented, with where to get it |
| `backend/docs/architecture/operations.md`, `frontend/docs/safeguards/http-hardening.md`, `frontend/docs/requirements/product-scope.md` | docs |
No endpoint, no API change, no client regeneration.

## O — Operations
Done by the user (nobody else can: it needs a Google account and a card on the billing account):
1. In the Google Cloud console, create a project, make sure billing is enabled, enable **Maps Embed API**, create an API key.
2. Restrict the key: *Websites* (HTTP referrers) `http://localhost:3000/*` and `https://erp.177-7-63-175.sslip.io/*`; *API restrictions*: Maps Embed API only. Add a budget alert to the billing account.
3. Put the key in `.env` (`GOOGLE_MAPS_EMBED_KEY=…`) and in the environment of the `frontend` service on the VPS, then restart the frontend.

Implementation:
1. Helpers and tests.
2. The component, the prop chain and the two pages.
3. `.env.example`, compose, docs.
4. Frontend gates and a browser check with a key and without one.

## N — Norms
Frontend: Server Component by default (the pages read the variable), `"use client"` only for the component; style only with design tokens; UI text in Portuguese; no secret in the repository (`AGENTS.md`, cross-stack rules).

## S — Safeguards
- **The key is public by design** (it is in the page's HTML): restrict it by referrer and to the one API, and set a budget alert; the Embed API itself has no per-request charge according to Google's documentation, the billing account is a Google Cloud requirement.
- **Privacy:** only a condominium's address (a company's address) goes to Google; no person's address (decision above).
- **Failure modes:** Google blocked or offline, or a wrong key: the frame is blank, and the link under it still works; a key that is missing never throws.
- **CSP:** none is enforced today; when it is, `frame-src https://www.google.com` is needed (written in `http-hardening.md`).
- **No API, no database, no key in the client bundle build.**

## Test plan
| Criterion | Test |
|---|---|
| R1 | `frontend/tests/maps.test.mjs::the embed url carries the key and the encoded address`; the follow-the-fields behavior is checked in the browser (this repo has no component tests: recorded as a gap, not omitted) |
| R2 | `frontend/tests/maps.test.mjs::the search url needs no key and encodes the address`; checked in the browser without a key |
| R3 | `frontend/tests/maps.test.mjs::an address is mappable with a full cep or with street and city only` |
| R4 | `git grep -n "AIza"` finds nothing; `python backend/docs/tools/check_docs.py` |
| R5 | `frontend/tests/maps.test.mjs::*` |
| R6 | `python backend/docs/tools/check_docs.py` |

## Definition of done
- [ ] Every criterion R1… has a passing test in the Test plan
- [ ] `pytest apps -q` green; `manage.py check` and `makemigrations --check --dry-run` clean (N/A — no backend change; run anyway in CI)
- [ ] `python backend/docs/tools/check_docs.py` passes
- [ ] Frontend client regenerated and callers fixed (`npm run generate:api`), or N/A — no API change
- [ ] `docs/apps/<app>.md` updated; `docs/known-gaps.md` row closed (if any): N/A — no app doc or gap applies
- [ ] Roadmap part and phase table updated (N/A — Roadmap is `none`); index in `features/README.md` updated
