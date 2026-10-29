import type { RegistrySectionId } from "@/lib/condominium-registry";

/** Uma seção da página do condomínio: âncora do índice, título e, à direita, as ações da seção. */
export function RegistrySection({
  id,
  title,
  actions,
  children,
}: {
  id: RegistrySectionId;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="text-heading">
          {title}
        </h2>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
