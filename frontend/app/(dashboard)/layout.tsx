import type { Metadata } from "next";

import { AppShell } from "./_components/shell/AppShell";

// O ERP é área privada: nunca entra no índice dos buscadores.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
