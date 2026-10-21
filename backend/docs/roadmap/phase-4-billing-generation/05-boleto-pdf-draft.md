---
summary: Plan and status of part 05 of phase 4 — Boleto PDF (draft).
read-when: you work on boleto pdf (draft) or need to know what it covers and whether it is done
skip-if: you need the whole phase → roadmap/phase-4-billing-generation/README.md; you need the process → roadmap/README.md
---
# Part 05 — Boleto PDF (draft)

**Status:** done · **Phase:** 4 (Billing issuance (generation)) · **Apps:** billing · **Frontend impact:** none · **Depends on:** 03
**Spec:** [027 — Boleto PDF (draft)](../../features/history.md) (section 027)

## Goal
Printable boleto without bank registration, for homologation.

## Scope
- [x] WeasyPrint HTML/CSS template
- [x] Payer, condominium, item lines; the company name as text (the logo waits for a file upload, `known-gaps.md`)
- [x] Store the PDF linked to the document

## Draft for the spec
Moved to the spec.

## Result
Done on 2026-10-21 (spec 027): `BillingDocumentPdf`, the WeasyPrint renderer and template ("RASCUNHO" watermark, no bank data), `generate_billing_document_pdf` storing it in the bucket, a task enqueued after each issuance commits, `GET`/`POST /api/billing-documents/{id}/pdf/`, client regenerated. Pango and `fonts-liberation` are now required in the image, CI and local machines (`operations.md`).
