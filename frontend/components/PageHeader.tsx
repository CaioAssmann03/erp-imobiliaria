import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/LinkButton";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <LinkButton
            href={back.href}
            variant="ghost"
            size="sm"
            aria-label={`Voltar para ${back.label}`}
            className="group -ml-2.5 mb-2 gap-1.5 px-2.5 text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
            {back.label}
          </LinkButton>
        )}
        <h1 className="text-title">{title}</h1>
        {description && <p className="mt-1.5 text-body text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
