import { Reveal } from "./Reveal";

interface SectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

/** Seção das páginas públicas: sobretítulo em rótulo laranja e título em serifa. */
export function Section({ id, eyebrow, title, children }: SectionProps) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 py-24">
      <Reveal className="mb-14 max-w-2xl">
        <p className="text-label text-brand">{eyebrow}</p>
        <h2 className="mt-3 font-display text-section">{title}</h2>
      </Reveal>
      {children}
    </section>
  );
}
