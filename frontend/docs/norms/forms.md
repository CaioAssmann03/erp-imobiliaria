---
summary: Form flow (schema → toForm → toPayload → server errors), react-hook-form and Zod usage, masks.
read-when: you build or change a form
skip-if: form file layout → structure/component-patterns.md; field names/rules → entities/domain-model.md
---
# Forms (N — Norms)

react-hook-form + Zod. File layout: structure/component-patterns.md.

## Flow
1. `lib/schemas/<resource>.ts`: Zod schema (input = what the user typed, masked strings; output = normalized),
   `XxxFormInput`/`XxxFormOutput`, `XXX_DEFAULTS`.
2. `xxxToForm(record)`: API record → form values (masks, `""` instead of `null`).
3. `xxxToPayload(values, isEdit)`: form → API body, including nested objects (`address`, `administration_contract`,
   `people_individual`...). Create: omit empty fields. Edit (PATCH): cleared field → `null` (or `""` for non-null text).
4. `use-xxx-submit.ts`: `useXxxCreate`/`useXxxPartialUpdate`, invalidate caches, `toast`, navigate.
5. `applyServerErrors(error, setError)` (`lib/form-errors.ts`) puts DRF errors (nested too) on fields; a non-field error also goes to `root.server`. Returns the toast message.
5b. **Where a form sits:** always through `FormPage` (`components/form/FormPage.tsx`): flush left, `max-w-3xl`, with the right menu as `aside`; without a menu it reserves the same space on wide screens, so the form is at the same point with or without it (never centered).
6. Errors show in three places: under each field (icon + red message, on a single line laid over the 20 px gap between fields: `FormField` reserves no space for it, so fields stay close and an error that appears pushes nothing; the full text is in the `title` and in the summary), in `FormErrorSummary` (rendered by `FormActions`, above the action bar: a plain solid bar (no glass, tint or glow) flush with the bottom edge of the screen (top corners rounded; when the form ends and the bar is released it becomes a fully rounded card, detected by the bar observing itself with `-bottom-px`), with the text "Alterações não salvas" while the form is dirty, on an existing record the Excluir (`ConfirmDeleteButton appearance="solid"`, passed as `danger`) on the left and Cancelar before Salvar on the right. The summary is a flat card: a count line ("Há 3 campos para corrigir") and one row per field, the label on the left and the message in the danger color on the right; a field that is not on screen or repeats in a list is named by `lib/form-labels.ts` ("Item 2 · Valor"): the general server error and one clickable line per invalid field, after a save attempt), and in a toast.

## react-hook-form
```tsx
const methods = useForm<XxxFormInput, unknown, XxxFormOutput>({
  resolver: zodResolver(xxxSchema), defaultValues: XXX_DEFAULTS, mode: "onTouched",
});
```
- Generics: input, context, output; `handleSubmit` receives the output. `<FormProvider {...methods}>`, `noValidate` on `<form>`.
- `defaultValues` define every field (`""`, not `undefined`).
- `useWatch` in the smallest component that must react; `getValues` in handlers; avoid top-level `watch()`.
- `reset(xxxToForm(record))` once when the record arrives; `setValue(..., {shouldDirty, shouldValidate})` for programmatic changes.
- Disable submit while `isSubmitting`; success/failure via `toast`.

## Zod v4
- Locale `z.config(z.locales.pt())` (in `lib/schemas/fields.ts`); messages are Portuguese.
- Reuse blocks from `lib/schemas/fields.ts`: `requiredText`, `optionalText`, `decimalField`, `dateField`, `intField`,
  `enumField`, `emailField`, `phoneField`, `cepField`, `ufField`. Normalize in `.transform` (trim, `""`→`undefined`, digits, decimals).
- Cross-field rules: `.refine` with `path` and `when: () => true` (show all errors at once). Types via `z.input`/`z.output`.

## Fields and masks
`components/form/fields/` (`TextField`, `SelectField`, `SearchSelectField`, `PersonSelectField`, `DateField`, `MonthField`, `CheckboxField`) + `FormSection`/`FieldRow`. Masks in `lib/masks.ts`
(`maskCpf`, `maskCnpj`, `maskCep`, `maskPhone`, `maskMoney`, `maskDecimal`, `maskInteger`); masks are display-only:
CPF/CNPJ/CEP leave as digits. Validators in `lib/validators.ts` mirror the backend.

`SelectField` is **controlled** (`value` comes from `useWatch`): the options usually load after `reset(xxxToForm(record))`, and an
uncontrolled native `<select>` only shows a value whose `<option>` already exists (the stored supplier, sub-account or block would
appear as the placeholder). Build any new select with `SelectField`, never a bare `<select {...register()}>` with async options.
A select whose options are **records of another domain** (condominium, block, sub-conta, event, entry template, criterion, supplier, person) is never a `SelectField`: use `SearchSelectField` (`SearchCombobox`: the field itself is typeable, the list shows at most 6 options, **Tab completes** with the first match, an optional field gets an "x" to clear) or, for people, `PersonSelectField` (`PersonSearchSelect`: server search by name, document or ID; the chosen person is always in the list). A list too big to load whole (suppliers, people) passes `onSearch` and searches on the server. `SelectField` stays for fixed enums; its empty text ("Selecione") shows only in the field, never as a list option, and an optional field with a value gets "Nenhum". **The "+" pattern**: a "+" button beside such a field registers the record in place when it can be created quickly (a few fields: `NewPersonDialog`, `NewSupplierDialog`, `NewCriterionDialog`); a record with many fields (a condominium, a unit) gets the "+" too, but it opens its own creation page instead of a dialog. Follow it for every new field of this kind. A dialog opened inside a form stops its own `submit` from bubbling to the parent form.
**Dates and months are never the browser input** (`<input type="date">` / `type="month"` / a bare masked text): use `DateField` (type `dd/mm/aaaa` or open the calendar, ISO value) and `MonthField` (type `mm/aaaa` or open the month calendar; `valueFormat="typed"` keeps "03/2026", `"iso"` keeps "2026-03"). Both share `DateCalendar` (days → months → years grid) with the `DateSelect` of the lists. While the text is incomplete the form keeps what was typed and the schema refuses it.

## Hints (the `hint` prop)
A field's explanation (a range, a unit, what an empty value means) is **not** printed under the field: `FormField` shows an info icon (`FieldHint`, a Base UI popover) next to the label, which opens on hover, tap or Enter, and keeps the same text in a screen-reader-only span tied to the control by `aria-describedby`. The line under the control is reserved for the **error** only, so the fields keep one rhythm and an error does not shift the ones below. Write a hint as a short sentence about the field ("Quantos dias antes do vencimento o desconto ainda vale. 0: só até o vencimento."); a label that needs a unit says it itself ("Prazo do desconto (dias)"). Do not repeat in the hint what the label or the placeholder already say.

## Rules
Field names = API names (server errors land correctly). Client validation helps; the **server is the truth**: always handle 400.
Never log form values (PII).
