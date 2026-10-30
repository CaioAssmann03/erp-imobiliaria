import { BackLink } from "@/components/layout/BackLink";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  /** Um "voltar" que só se sabe depois de carregar (client), no lugar de `back`. */
  backSlot?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, back, backSlot, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? <BackLink href={back.href} label={back.label} /> : backSlot}
        <h1 className="text-title">{title}</h1>
        {description && <p className="mt-1.5 text-body text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
