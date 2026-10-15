import assert from "node:assert/strict";
import { test } from "node:test";

import { backendApiPath } from "../lib/api-path.ts";

const ACCOUNT_ID = "f7ca8b44-67fa-4e35-a87c-a589eda3ab19";

test("builds the Django path for ordinary routes", () => {
  assert.equal(backendApiPath(["accounts-payable"]), "/api/accounts-payable/");
  assert.equal(backendApiPath(["accounts-payable", ACCOUNT_ID]), `/api/accounts-payable/${ACCOUNT_ID}/`);
  assert.equal(
    backendApiPath(["payment-receipts", ACCOUNT_ID, "download-url"]),
    `/api/payment-receipts/${ACCOUNT_ID}/download-url/`
  );
  assert.equal(backendApiPath(["auth", "login"]), "/api/auth/login/");
});

test("rejects a request without segments", () => {
  assert.equal(backendApiPath([]), null);
});

// Next decodes each segment, so `/api/..%2fadmin/login/` reaches the handler as ["../admin", "login"].
test("rejects segments that climb out of /api", () => {
  for (const segments of [
    ["..", "admin", "login"],
    ["../admin", "login"],
    ["auth", "../../admin"],
    [".", "admin"],
    ["%2e%2e", "admin"],
    ["..%2fadmin", "login"],
    ["admin%2flogin"],
    ["a/b"],
    ["a\\b"],
  ]) {
    assert.equal(backendApiPath(segments), null, JSON.stringify(segments));
  }
});

test("rejects empty segments and characters that are not part of a route name or id", () => {
  for (const segment of ["", " ", "a b", "a.b", "a?b", "a#b", "a;b", "a:b", "a@b", "é"]) {
    assert.equal(backendApiPath(["accounts-payable", segment]), null, JSON.stringify(segment));
  }
});
