import { PersonsFrame } from "./_components/PersonsFrame";

export default function PersonsLayout({ children }: { children: React.ReactNode }) {
  return <PersonsFrame>{children}</PersonsFrame>;
}
