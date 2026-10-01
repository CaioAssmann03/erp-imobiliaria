export function cleanPayload<T extends Record<string, unknown>>(
  values: T
): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === "" || value === undefined) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

export function toOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  return Number(value);
}
