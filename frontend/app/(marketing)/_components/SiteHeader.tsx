"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { cn } from "@/lib/utils";

import { NAV_LINKS } from "./content";
import { MarketingButton } from "./MarketingButton";

/** Cabeçalho das páginas públicas: navegação em rótulos (mono, caixa-alta); ganha fundo depois que a página rola. */
export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled && "bg-canvas/85 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label="Página inicial">
          <Brand />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label text-ink-soft transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <MarketingButton href="/login">Entrar</MarketingButton>
      </div>
    </header>
  );
}
