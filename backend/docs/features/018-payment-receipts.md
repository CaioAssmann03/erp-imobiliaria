---
summary: Payment receipts — PDF/JPEG/PNG files attached to a paid account payable, kept in a Cloudflare R2 bucket and moved by signed URLs.
read-when: you build or change receipt upload/download, the object storage client, or the receipt controls on the account payable screens
skip-if: settling or cancelling an account → apps/finance.md; the plan of the phase → roadmap/phase-3-finance-base/06-payment-receipts.md; the rest of the finance API → architecture/api.md
---
# 018 — Payment receipts

**Status:** in-progress · **Level:** full · **Roadmap:** phase 3 part 06 · **Apps:** finance, core, frontend · **Frontend impact:** client regeneration + new screens

## Open questions
None.

## Decisions
| Date | Decision | Decided by |
|---|---|---|
| 2026-10-08 | Bucket: Cloudflare R2 (S3-compatible, no egress fees). Credentials come only from environment variables. | the user |
| 2026-10-08 | Several receipts per account payable: one `PaymentReceipt` row per file. | the user |
| 2026-10-08 | Allowed types PDF, JPEG, PNG; at most 10 MB per file. | the user |
| 2026-10-08 | Upload by a signed URL straight from the browser to the bucket; the file never crosses Next or Django. | the user |
| 2026-10-08 | Any user of the company may delete a receipt; the object is removed from the bucket too. The audit log keeps who and when. | the user |
| 2026-10-08 | Only `boto3` is added (no `django-storages`): with signed URLs Django never reads or writes the file. | the user |
| 2026-10-08 | Hosting is the VPS (phase 3a part 01), so the part is no longer blocked. | the user |

## R — Requirements
A paid account payable can carry the proof of payment (a PDF or a photo), stored outside the server's disk. Today a settled account has no receipt control.
- [ ] R1 — A user attaches a PDF, JPEG or PNG of at most 10 MB to a **paid** account payable of their company; an open or cancelled account refuses it.
- [ ] R2 — A file of another type, empty or above 10 MB is refused before any upload URL is issued; a file that reaches the bucket with another size is rejected and deleted on confirmation.
- [ ] R3 — An account payable may have several receipts; the list of an account shows only confirmed ones, with name, type, size, who sent it and when.
- [ ] R4 — The user downloads a receipt through a temporary signed URL that makes the browser save the file under its original name.
- [ ] R5 — The user deletes a receipt: the row and the object in the bucket are removed.
- [ ] R6 — Another company's account, receipt or file is 404 in every endpoint (company scoping, spec 004).
- [ ] R7 — Without the bucket settings the endpoints answer 503 with a coded error, and nothing else in the finance API is affected.
- [ ] R8 — The account payable screen shows the receipts of a paid account, with attach, download and delete; the settle dialog stays as it is (a receipt is attached after the payment, not required by it).

## E — Entities
| Entity | Change | Fields / rules |
|---|---|---|
| `PaymentReceipt` (new, `BaseModel`, `@final`, audited) | the PDF's *anexo_comprovante* | `account_payable` FK `PROTECT` (a paid account cannot be deleted anyway); `file_key` (text, unique, built by the service: `payment-receipts/<company_id>/<account_payable_id>/<uuid>`, never from the user's file name); `original_name` (≤ 255, trimmed); `content_type` (choices `application/pdf`, `image/jpeg`, `image/png`); `size_bytes` (positive integer, ≤ 10 MB, validator); `uploaded_by` FK to the user, `PROTECT`, set by the service; `confirmed_at` (datetime, null until the file is checked in the bucket). `company_lookup = "account_payable__company"`. |
| `PaymentReceiptRules` (`models/rules/payment_receipt.py`) | the cross-field rule | the account payable must be `paid`. |
| `PaymentReceiptError` (`errors/payment_receipt.py`) | codes | `payment_receipt.account_payable.not_paid`, `payment_receipt.content_type.not_allowed`, `payment_receipt.size_bytes.too_large`, `payment_receipt.size_bytes.not_positive`, `payment_receipt.file.missing_in_storage`, `payment_receipt.file.size_mismatch`, `payment_receipt.already_confirmed`, `object_storage.unavailable` (in `apps/core/errors/object_storage.py`). |

Constants (`apps/finance/models/payment_receipt.py`): `MAX_RECEIPT_SIZE_BYTES = 10 * 1024 * 1024`, `ALLOWED_RECEIPT_CONTENT_TYPES`, `UPLOAD_URL_TTL_SECONDS = 600`, `DOWNLOAD_URL_TTL_SECONDS = 300`.

## A — Approach
- **Object storage client** in `core` (`apps/core/storage/object_storage.py`): a thin class over `boto3` with `presigned_upload_url`, `presigned_download_url`, `object_size`, `delete_object`. `get_object_storage()` builds it from settings and raises the coded 503 error when the settings are empty. Tests replace `get_object_storage` with an in-memory fake; the code never imports `boto3` outside this module.
- **Three steps**, because R2 has no POST policy and a signed PUT cannot cap the size:
  1. `POST /accounts-payable/{id}/receipts/` (`original_name`, `content_type`, `size_bytes`) → a service validates, creates the unconfirmed `PaymentReceipt` and answers its id and the signed PUT URL (type bound into the signature).
  2. The browser `PUT`s the file straight to the bucket.
  3. `POST /payment-receipts/{id}/confirm/` → a service reads the real size from the bucket (`HEAD`); missing or different from the declared size → the object and the row are deleted and a coded 400 answers; otherwise `confirmed_at` is set.
- **Download**: `GET /payment-receipts/{id}/download-url/` answers a signed GET URL with `Content-Disposition: attachment; filename=<original_name>`.
- **Delete**: `DELETE /payment-receipts/{id}/` removes the row and, in `transaction.on_commit`, the object. A failed object delete leaves an orphan object, never a row pointing at nothing.
- **Rejected**: receiving the file in Django (the Next proxy carries JSON only and the VPS would spend bandwidth and memory); `django-storages` (unused with signed URLs); one `FileField` on `AccountPayable` (only one file per account).
- Business rules stay in the model (`PaymentReceiptRules`, validators); the services hold orchestration only (`practices.md` §3b).

## S — Structure
New files: `apps/core/storage/__init__.py`, `apps/core/storage/object_storage.py`, `apps/finance/models/payment_receipt.py`, `apps/finance/models/rules/payment_receipt.py`, `apps/finance/errors/payment_receipt.py`, `apps/finance/services/create_payment_receipt.py`, `apps/finance/services/confirm_payment_receipt.py`, `apps/finance/services/delete_payment_receipt.py`, `apps/finance/serializers/payment_receipt_serializers.py`, `apps/finance/views/payment_receipt_views.py`, a migration, tests in `apps/finance/tests/test_payment_receipts.py` and `apps/core/tests/infrastructure/test_object_storage.py`.
Changed: `config/settings.py` (bucket settings), `requirements.txt` (`boto3`), `apps/finance/models/__init__.py`, `errors/__init__.py`, `services/__init__.py`, `serializers/__init__.py`, `views/__init__.py`, `urls.py`, `audit.py` (`register_audited(PaymentReceipt)`), `admin.py` (read-only, no file field), `.env.example`, and the frontend files listed in Operations.

| Method | URL | Request | Response | Notes |
|---|---|---|---|---|
| POST | `/api/accounts-payable/{id}/receipts/` | `original_name`, `content_type`, `size_bytes` | `id`, `upload_url`, `upload_headers`, `expires_in` | creates the unconfirmed receipt; 400 if the account is not paid or the file is not allowed |
| POST | `/api/payment-receipts/{id}/confirm/` | none | the receipt | checks the object in the bucket |
| GET | `/api/payment-receipts/` | filter `account_payable` | confirmed receipts, newest first | read-only list and retrieve |
| GET | `/api/payment-receipts/{id}/download-url/` | none | `download_url`, `expires_in` | |
| DELETE | `/api/payment-receipts/{id}/` | none | 204 | |

Settings (env only): `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL` (`https://<account>.r2.cloudflarestorage.com`), `AWS_S3_REGION_NAME` (default `auto`).

## O — Operations
1. Add `boto3` (pinned) to `requirements.txt`; add the settings and the `.env.example` placeholders.
2. `ObjectStorage` + `get_object_storage()` + its test with a stubbed client.
3. Model, rules class, error codes, migration; register the audit and the read-only admin.
4. Services (`create`, `confirm`, `delete`), serializers, viewsets and routes (nested create under `accounts-payable`).
5. Tests of the Test plan; `pytest apps -q`, `manage.py check`, `makemigrations --check --dry-run`.
6. Regenerate the frontend client (`npm run generate:api`); build the receipts panel on the account payable screen (list, attach, download, delete; the upload shows "Enviando…", no progress bar) following `frontend/docs/`.
7. R2 setup by the user (see Safeguards), then `AWS_*` in `/root/erp-imobiliaria/.env` on the VPS and a manual end-to-end check over HTTPS.
8. Update docs: `apps/finance.md`, `architecture/overview.md` (env vars), `architecture/operations.md` (R2 and backup note), `known-gaps.md` (orphan objects), the roadmap part and phase, the index in `features/README.md`, then move this spec to `history.md` when `done`.

## N — Norms
`practices.md` §3b (services hold no rule), §2 (rules in the model), `naming.md` (no abbreviations, `size_bytes`, `*_seconds` constants). Audit: `PaymentReceipt` is audited (who attached and deleted). Files never go through Next: the proxy keeps carrying JSON only. The only call outside the generated client is the browser's `PUT` to the signed URL (`frontend/lib/payment-receipts.ts`).

## S — Safeguards
- **Security.** The bucket is private; there is no public URL. Signed URLs are short-lived (upload 10 min, download 5 min), single-object and, for upload, bound to the declared content type. The object key is built by the server (never from the file name), so a name cannot walk paths. `original_name` is only a label and goes to `Content-Disposition` quoted and stripped of control characters. Company scoping applies to every endpoint; a foreign id is 404.
- **Size and type.** A signed PUT cannot cap the size, so the confirmation compares the bucket's real size with the declared one and with the 10 MB limit, and deletes the object on any mismatch.
- **Orphans.** An unconfirmed receipt whose upload never happens leaves a row with `confirmed_at` empty (hidden from every list) and possibly an object. A cleanup task is out of scope and goes to `known-gaps.md`.
- **R2 setup (by the user, outside the code).** Create the bucket (private), an API token limited to that bucket with object read/write, and a CORS rule that allows `PUT` and `GET` from the ERP origin with the `Content-Type` header. Without CORS the browser upload is blocked.
- **Backup.** The files live in R2, not on the VPS; the Postgres backup does not cover them. Documented in `operations.md`.
- **Failure modes.** Bucket unreachable or unset → coded 503 on these endpoints only. Deleting a receipt whose upload is still in flight is allowed; a late `PUT` then only creates an unreferenced object (an orphan, see above).
- **Compatibility.** New endpoints and a new table only; no change to existing contracts. Regeneration of the client is required.

## Test plan
| Criterion | Test |
|---|---|
| R1 | `apps/finance/tests/test_payment_receipts.py::test_attaches_a_receipt_to_a_paid_account` · `::test_open_account_refuses_a_receipt` · `::test_cancelled_account_refuses_a_receipt` |
| R2 | `::test_refuses_a_type_that_is_not_allowed` · `::test_refuses_an_empty_or_oversized_file` · `::test_confirm_rejects_and_deletes_a_size_mismatch` · `::test_confirm_rejects_a_missing_object` |
| R3 | `::test_lists_only_confirmed_receipts_of_the_account` · `::test_an_account_may_have_several_receipts` |
| R4 | `::test_download_url_is_signed_and_names_the_file` |
| R5 | `::test_delete_removes_the_row_and_the_object` · `::test_delete_leaves_no_row_pointing_at_nothing` |
| R6 | `::test_another_company_receipt_is_404` · `::test_another_company_account_is_404` |
| R7 | `apps/core/tests/infrastructure/test_object_storage.py::test_unset_bucket_raises_a_coded_error` · `apps/finance/tests/test_payment_receipts.py::test_endpoints_answer_503_without_the_bucket` |
| R8 | Gap: the project has no frontend test runner (see `frontend/docs/`); checked by hand and by `npm run lint` + `tsc --noEmit`. |

Layers: model/constraint (rules), serializer validation, API (create, confirm, list, download, delete, scoping), the storage client with a stubbed `boto3`.

## Definition of done
- [x] Every criterion R1… has a passing test in the Test plan (R8 has no test runner: checked with `tsc`, `eslint` and `npm run build`)
- [x] `pytest apps -q` green (677); `manage.py check` and `makemigrations --check --dry-run` clean
- [x] `python backend/docs/tools/check_docs.py` passes
- [x] Frontend client regenerated and callers fixed (`npm run generate:api`; stale messages of removed codes dropped from `lib/error-messages.ts`)
- [x] `docs/apps/finance.md` updated; `docs/known-gaps.md` row 31 added for orphan objects
- [x] Roadmap part 06 and phase 3 table updated; index in `features/README.md` updated
- [ ] R2 bucket, token and CORS created; `AWS_*` set on the VPS; one receipt uploaded and downloaded over HTTPS
