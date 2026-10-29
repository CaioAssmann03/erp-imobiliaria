import { UnitsFrameBoundary } from "../[id]/units/_components/UnitsFrame";

export default function UnitsLayout({ children }: { children: React.ReactNode }) {
  return <UnitsFrameBoundary>{children}</UnitsFrameBoundary>;
}
