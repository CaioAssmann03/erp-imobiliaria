import { CondominiumsSubNav } from "./_components/CondominiumsSubNav";

export default function CondominiumsListsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CondominiumsSubNav />
      {children}
    </div>
  );
}
