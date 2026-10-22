---
summary: Plan and status of part 06 of phase 2a — the Documentos section (upload with type, grid and list, PDF preview) and the Histórico de operações section (the audit trail of a condominium).
read-when: you plan or build the documents of a condominium or the screen of its operation history
skip-if: you need the whole phase → roadmap/phase-2a-condominium-workspace/README.md; the audit trail itself → apps/core.md
---
# Part 06 — Documents and operation history

**Status:** todo · **Phase:** 2a (Condominium workspace) · **Apps:** condominiums, core, frontend · **Frontend impact:** new screens · **Depends on:** part 01
**Spec:** none yet

## Goal
The two sections that need storage and the audit trail: documents of the condominium and the history of what was changed in it.

## Scope
- [ ] Documentos: upload with a document type (Ata and others), grid and list views, a type filter, the total, a preview of the PDF and a menu per document
- [ ] Histórico de operações: the changes of the condominium and of what hangs from it, from the audit trail (who, when, what)

## Draft for the spec
### Entities
| Reference | Code name | Notes |
|---|---|---|
| Documento | `CondominiumDocument` (proposal) | condominium, type, title, file key; files go straight to the bucket with a signed URL, as the payment receipts do |
| Tipo de documento | catalog (proposal) | Ata, and the others the print with the type filter open shows |

### Business rules
- A file never goes through the Next proxy; the backend checks the upload before the document exists (as the receipts).

### Open questions
- [ ] The document types, the maximum size and the allowed formats (recommended: PDF and images up to 10 MB; ask the user for the types)
- [ ] Who may see the history, and is anything masked? (recommended: administrators; payment and personal data stay masked)

## Result
