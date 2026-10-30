import { UnitsFrameBoundary } from "@/app/(dashboard)/condominiums/(condominium)/[id]/units/_components/UnitsFrame";

export default function UnitsLayout({ children }: { children: React.ReactNode }) {
  return <UnitsFrameBoundary>{children}</UnitsFrameBoundary>;
}
