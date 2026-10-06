import { FinanceSubNav } from "./_components/FinanceSubNav";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <FinanceSubNav />
      {children}
    </div>
  );
}
