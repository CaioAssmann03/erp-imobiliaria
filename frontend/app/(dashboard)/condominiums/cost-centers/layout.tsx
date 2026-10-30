import { CostCentersFrame } from "@/app/(dashboard)/condominiums/_components/cost-centers/CostCentersFrame";

export default function CostCentersLayout({ children }: { children: React.ReactNode }) {
  return <CostCentersFrame>{children}</CostCentersFrame>;
}
