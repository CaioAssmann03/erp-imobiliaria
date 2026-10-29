"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { MetriLogo } from "@/components/MetriLogo";
import { ModeToggle } from "@/components/ModeToggle";
import { cn } from "@/lib/utils";

import { NAV_LINKS } from "./content";
import { MarketingButton } from "./MarketingButton";

/**
 * Cabeçalho das páginas públicas: o logo METRI (casa e nome) à esquerda, a navegação em rótulos (caixa-alta) no meio e, à direita, o acesso
 * ao sistema; ganha fundo depois que a página rola.
 */
export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const onLogin = usePathname() === "/login"; // lá o botão "Entrar" não faz sentido
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled && "bg-canvas/95",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <div className="flex flex-1 items-center">
          <Link href="/" aria-label="Página inicial">
            <MetriLogo className="h-8 w-auto" />
          </Link>
        </div>
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
        <div className="flex flex-1 items-center justify-end gap-2">
          <ModeToggle />
          {!onLogin && (
            <MarketingButton href="/login" variant="outline">
              Entrar
            </MarketingButton>
          )}
        </div>
      </div>
    </header>
  );
}
