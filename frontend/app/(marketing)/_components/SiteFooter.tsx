import Link from "next/link";

import { Brand } from "@/components/Brand";

import { NAV_LINKS } from "./content";

/** Rodapé das páginas públicas, logo abaixo da faixa preta do contato. */
export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
      <Brand />
      <nav aria-label="Rodapé" className="flex flex-wrap gap-6">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-label text-ink-soft transition-colors hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>
      <p className="text-label text-ink-faint">© {new Date().getFullYear()} EVE Administradora de Imóveis</p>
    </footer>
  );
}
