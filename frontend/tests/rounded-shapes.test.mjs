import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

/** Buttons, badges and chips are never oval or circular (`conventions/design-system.md`): `rounded-full` is only for dots, bars and the switch. */
const ROOT = join(import.meta.dirname, "..");
const FOLDERS = ["app/(dashboard)", "components"];

/** The files where a round shape is a shape and not a control: status dots, progress bars, chart dots, the sheet's grab handle, the index marker, the switch. */
const SHAPES = new Set([
  "app/(dashboard)/_components/home/bodies/BillingMonthBody.tsx",
  "app/(dashboard)/_components/home/layout/WidgetSketch.tsx",
  "app/(dashboard)/_components/home/charts/DotMatrix.tsx",
  "app/(dashboard)/_components/home/widgets/focus/PendingFocus.tsx",
  "app/(dashboard)/_components/home/widgets/focus/parts.tsx",
  "app/(dashboard)/_components/shell/SettingsDialog.tsx",
  "app/(dashboard)/_components/shell/settings/SettingsSwitch.tsx",
  "app/(dashboard)/finance/accounts-payable/_components/PayableStatusBadge.tsx",
  "app/(dashboard)/billing/documents/_components/BillingDocumentStatusBadge.tsx",
  "app/(dashboard)/billing/runs/_components/BillingRunStatusBadge.tsx",
  "app/(dashboard)/reports/_components/PayableWindows.tsx",
  "components/layout/SectionIndex.tsx",
]);

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

test("no button, badge or chip is round: rounded-full stays on dots, bars and the switch", () => {
  const offenders = FOLDERS.flatMap((folder) => sourceFiles(join(ROOT, folder)))
    .map((file) => relative(ROOT, file))
    .filter((file) => !SHAPES.has(file) && /rounded-full/.test(readFileSync(join(ROOT, file), "utf8")));
  assert.deepEqual(offenders, [], "use rounded-button, rounded-badge or rounded-panel (conventions/design-system.md)");
});
