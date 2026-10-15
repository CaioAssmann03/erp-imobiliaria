/**
 * Only route names and ids (letters, digits, `-`, `_`) may cross the `/api` proxy. Next decodes each URL
 * segment, so `..%2fadmin` arrives as `../admin`; `fetch` then normalizes `/api/../admin/` to `/admin/` and the
 * proxy would serve Django routes outside `/api` (the Admin). Dots, slashes, `%` and empty segments never match.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

/** The Django path (`/api/<segments>/`) for the URL segments after `/api`, or `null` when any of them is not safe. */
export function backendApiPath(segments: readonly string[]): string | null {
  if (segments.length === 0 || !segments.every((segment) => SAFE_SEGMENT.test(segment))) return null;
  return `/api/${segments.join("/")}/`;
}
