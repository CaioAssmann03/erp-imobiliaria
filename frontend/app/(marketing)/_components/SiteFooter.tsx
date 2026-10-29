import Link from "next/link";

import { Brand } from "@/components/Brand";

import { CONTACT_HREF, FEATURES } from "./content";
import { MarketingButton } from "./MarketingButton";

const SITE_LINKS = [
  { href: "/", label: "Início" },
  { href: "/features", label: "Recursos" },
  { href: "/how-it-works", label: "Como funciona" },
] as const;

const ACCESS_LINKS = [
  { href: CONTACT_HREF, label: "Agendar demonstração" },
  { href: "/login", label: "Entrar no sistema" },
] as const;

const LINK_CLASS = "text-body text-ink-foreground/65 transition-colors hover:text-ink-foreground";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <nav aria-label={title}>
      <p className="text-label text-ink-foreground/50">{title}</p>
      <ul className="mt-4 flex flex-col gap-3">{children}</ul>
    </nav>
  );
}

/** Rodapé das páginas públicas: faixa preta de ponta a ponta com a chamada de contato (`#contato`), os mapas do site e dos módulos. */
export function SiteFooter() {
  return (
    <footer id="contato" className="mt-12 scroll-mt-16 bg-ink text-ink-foreground">
      <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-10">
          <div>
            <Brand />
            <p className="mt-6 max-w-sm text-body text-ink-foreground/65">
              Sistema de gestão para administradoras de condomínios: cadastro, cobrança, conciliação bancária e
              financeiro em um só lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MarketingButton href={CONTACT_HREF} variant="inverse">
                Agendar demonstração
              </MarketingButton>
              <MarketingButton href="/login" variant="inverse-outline">
                Entrar
              </MarketingButton>
            </div>
          </div>

          <FooterColumn title="Site">
            {SITE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Módulos">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <Link href="/features" className={LINK_CLASS}>
                  {feature.title}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Acesso">
            {ACCESS_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-ink-foreground/15 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-label text-ink-foreground/50">
            © {new Date().getFullYear()} EVE Administradora de Imóveis
          </p>
          <p className="text-label text-ink-foreground/50">ERP Imobiliária</p>
        </div>
      </div>
    </footer>
  );
}
