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
6. Errors show in three places: under each field (icon + red message), in `FormErrorSummary` (rendered by `FormActions`, above the sticky bar: the general server error and one clickable line per invalid field, after a save attempt), and in a toast.

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

## Rules
Field names = API names (server errors land correctly). Client validation helps; the **server is the truth**: always handle 400.
Never log form values (PII).
