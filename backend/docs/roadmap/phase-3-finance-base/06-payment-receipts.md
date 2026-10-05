---
summary: Plan and status of part 06 of phase 3 — Payment receipts.
read-when: you work on payment receipts or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-3-finance-base/README.md; you need the process → roadmap/README.md
---
# Part 06 — Payment receipts

**Status:** todo · **Phase:** 3 (Finance base) · **Apps:** finance, frontend · **Frontend impact:** client regeneration · **Depends on:** 03, and the backend hosting (phase 3a part 01)
**Spec:** none yet (planned: full)

## Goal
Attach the payment receipt (a PDF or photo) to a settled account payable, stored outside the server's disk.

## Scope
- [ ] File storage on an S3-compatible bucket (`django-storages`; Backblaze B2 or Cloudflare R2 per the stack), configured by environment variables
- [ ] Signed upload and download URLs (the Next proxy only carries JSON and Vercel caps request bodies near 4.5 MB)
- [ ] Link the file to the `AccountPayable` it proves; only a paid account has a receipt

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
- [ ] Which bucket provider and region (depends on the hosting chosen in phase 3a part 01)? (recommended: Cloudflare R2, no egress fees)
- [ ] One receipt per account or several? (recommended: one `PaymentReceipt` row per file, several allowed)
- [ ] Allowed types and size (PDF, JPEG, PNG; limit)? (recommended: PDF/JPEG/PNG up to 10 MB)

## Result
Not started.
