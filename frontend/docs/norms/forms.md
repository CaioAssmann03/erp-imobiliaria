---
summary: Form flow (schema → toForm → toPayload → server errors), react-hook-form and Zod usage, masks.
read-when: you build or change a form
skip-if: form file layout → structure/component-patterns.md; field names/rules → entities/domain-model.md
---
# Forms (N — Norms)

react-hook-form + Zod. File layout: structure/component-patterns.md.

A long form can show one section at a time (the condominium form): keep **one** `useForm`, render every section and mark each panel `data-section="<id>"` + `hidden` when closed, so values, validation and the single save survive the switch. Never unmount a closed section. See structure/folders-and-routes.md.

## Flow
1. `lib/schemas/<resource>.ts`: Zod schema (input = what the user typed, masked strings; output = normalized),
   `XxxFormInput`/`XxxFormOutput`, `XXX_DEFAULTS`.
2. `xxxToForm(record)`: API record → form values (masks, `""` instead of `null`).
3. `xxxToPayload(values, isEdit)`: form → API body, including nested objects (`address`, `administration_contract`,
   `people_individual`...). Create: omit empty fields. Edit (PATCH): cleared field → `null` (or `""` for non-null text).
4. `use-xxx-submit.ts`: `useXxxCreate`/`useXxxPartialUpdate`, invalidate caches, `toast`, navigate.
5. `applyServerErrors(error, setError)` (`lib/form-errors.ts`) puts DRF errors (nested too) on fields; a non-field error also goes to `root.server`. Returns the toast message.
6. Errors show in three places: under each field (icon + red message), in `FormErrorSummary` (rendered by `FormActions`, above the action bar: a plain solid bar stuck flush to the bottom edge of the screen (`sticky bottom-0`, no gap, nothing shows behind or below it; no glass, tint or glow) with the text "Alterações não salvas" while the form is dirty and Cancelar before Salvar on the right. The summary is a flat card: a count line ("Há 3 campos para corrigir") and one row per field, the label on the left and the message in the danger color on the right; a field that is not on screen or repeats in a list is named by `lib/form-labels.ts` ("Item 2 · Valor"): the general server error and one clickable line per invalid field, after a save attempt), and in a toast.

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
`components/form/fields/` (`TextField`, `SelectField`, `CheckboxField`) + `FormSection`/`FieldRow`. Masks in `lib/masks.ts`
(`maskCpf`, `maskCnpj`, `maskCep`, `maskPhone`, `maskMoney`, `maskDecimal`, `maskInteger`); masks are display-only:
CPF/CNPJ/CEP leave as digits. Validators in `lib/validators.ts` mirror the backend.

`SelectField` is **controlled** (`value` comes from `useWatch`): the options usually load after `reset(xxxToForm(record))`, and an
uncontrolled native `<select>` only shows a value whose `<option>` already exists (the stored supplier, sub-account or block would
appear as the placeholder). Build any new select with `SelectField`, never a bare `<select {...register()}>` with async options.

## Hints (the `hint` prop)
A field's explanation (a range, a unit, what an empty value means) is **not** printed under the field: `FormField` shows an info icon (`FieldHint`, a Base UI popover) next to the label, which opens on hover, tap or Enter, and keeps the same text in a screen-reader-only span tied to the control by `aria-describedby`. The line under the control is reserved for the **error** only, so the fields keep one rhythm and an error does not shift the ones below. Write a hint as a short sentence about the field ("Quantos dias antes do vencimento o desconto ainda vale. 0: só até o vencimento."); a label that needs a unit says it itself ("Prazo do desconto (dias)"). Do not repeat in the hint what the label or the placeholder already say.

## Rules
Field names = API names (server errors land correctly). Client validation helps; the **server is the truth**: always handle 400.
Never log form values (PII).
