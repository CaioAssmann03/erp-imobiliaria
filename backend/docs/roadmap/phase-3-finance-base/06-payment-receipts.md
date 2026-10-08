---
summary: Plan and status of part 06 of phase 3 — Payment receipts.
read-when: you work on payment receipts or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 06 — Payment receipts

**Status:** in-progress · **Phase:** 3 (Finance base) · **Apps:** finance, frontend · **Frontend impact:** client regeneration · **Depends on:** 03, and the backend hosting (phase 3a part 01)
**Spec:** [018](../../features/018-payment-receipts.md) (full)

## Goal
Attach the payment receipt (a PDF or photo) to a settled account payable, stored outside the server's disk.

## Scope
- [x] File storage on an S3-compatible bucket (Cloudflare R2, `boto3` only), configured by environment variables
- [x] Signed upload and download URLs (the Next proxy only carries JSON)
- [x] Link the file to the `AccountPayable` it proves; only a paid account has a receipt
- [x] Receipts panel on the paid account screen (list, attach, download, delete)
- [ ] Create the R2 bucket, token and CORS rule, set `AWS_*` on the VPS and check one upload and download end to end

## Why it was blocked (resolved 2026-10-08)
The Trello card accepts "local disk for now", but the Next proxy (`app/api/[...path]`) carries JSON only, by design: a file would have to reach Django through a signed URL of a bucket, which needs the hosting and the provider decided (phase 3a part 01). The hosting is now decided (the VPS, with HTTPS) and the bucket is Cloudflare R2, so the part is unblocked; the settle dialog and the account have no receipt control until spec 018 is done.

## Draft for the spec
Moved out of part 03 by the user's decision (2026-10-05): no storage and no host exist yet.

### Entities
| PDF name | Code name | Notes |
|---|---|---|
| anexo_comprovante | receipt file on `AccountPayable` (or a small `PaymentReceipt` record) | the PDF stores every file next to the record that originated it, never loose in a folder |

### Business rules
- A file is always linked to the record that produced it.
- The bucket credentials come from environment variables only (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME` per the stack PDF).

### Open questions
None: answered on 2026-10-08 and recorded in spec 018 (Cloudflare R2; several receipts, one row per file; PDF/JPEG/PNG up to 10 MB).

## Result
Backend and screen implemented on 2026-10-08 (spec 018): `PaymentReceipt` (migration `0011`), three services, `payment-receipts` API and `POST /accounts-payable/{id}/receipts/`, the `core` storage client, the panel in the paid account screen. `pytest apps -q` 677 passed; frontend `tsc`, `eslint` and `npm run build` clean.
**Left:** the R2 bucket, its token and the CORS rule do not exist yet (they are created in the Cloudflare account by the user); until the `AWS_*` variables are set the endpoints answer 503 and the panel shows the error. Then deploy and check one real upload, which closes this part and the spec.
