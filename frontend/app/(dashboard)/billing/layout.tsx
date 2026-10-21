import { BillingSubNav } from "./_components/BillingSubNav";

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BillingSubNav />
      {children}
    </div>
  );
}
