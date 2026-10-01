import Link from "next/link";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, back, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-block text-body text-ink-soft transition-colors hover:text-ink"
          >
            ‹ {back.label}
          </Link>
        )}
        <h1 className="text-title">{title}</h1>
        {description && <p className="mt-1.5 text-body text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
