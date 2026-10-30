import { Reveal } from "./Reveal";

/** Abertura das páginas internas públicas (Recursos, Como funciona): mesmo tom do hero da home. */
export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  return (
    <Reveal className="mx-auto max-w-3xl px-6 pt-40 pb-6 text-center">
      <p className="text-label text-brand">{eyebrow}</p>
      <h1 className="mt-4 font-display text-hero">{title}</h1>
      <p className="mx-auto mt-5 max-w-xl text-body text-ink-soft">{lead}</p>
    </Reveal>
  );
}
