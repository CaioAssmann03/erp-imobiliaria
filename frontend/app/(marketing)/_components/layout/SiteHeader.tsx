"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { MetriLogo } from "@/components/brand/MetriLogo";
import { ModeToggle } from "@/components/ModeToggle";
import { cn } from "@/lib/utils";

import { MODULE_LINKS, NAV_LINKS } from "@/app/(marketing)/_components/content";
import { MarketingButton } from "@/app/(marketing)/_components/MarketingButton";

/**
 * Cabeçalho das páginas públicas: o logo METRI (casa e nome) à esquerda, a navegação em rótulos (caixa-alta) no meio e, à direita, o acesso
 * ao sistema; ganha fundo depois que a página rola.
 */
export function SiteHeader() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const onLogin = pathname === "/login"; // lá o botão "Entrar" não faz sentido
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
            <MetriLogo className="h-7 w-auto" />
          </Link>
        </div>
        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) =>
            link.href === "/features" ? (
              <div key={link.href} className="group relative">
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1 text-label transition-colors hover:text-ink",
                    pathname.startsWith("/features") ? "text-ink" : "text-ink-soft",
                  )}
                >
                  {link.label}
                  <ChevronDown aria-hidden className="size-3 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180" />
                </Link>
                {/* O submenu: um respiro invisível (pt-4) liga o rótulo ao painel, para o mouse não o perder no caminho. */}
                <div className="invisible absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 transition-opacity duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="w-72 border border-ink/10 bg-canvas p-1.5">
                    {MODULE_LINKS.map((module) => (
                      <li key={module.href}>
                        <Link
                          href={module.href}
                          onClick={(event) => event.currentTarget.blur()}
                          className="block px-3 py-2.5 transition-colors hover:bg-ink/5 focus-visible:bg-ink/5"
                        >
                          <span className="block text-sm font-medium text-ink">{module.label}</span>
                          <span className="mt-0.5 block text-xs text-ink-soft">{module.summary}</span>
                        </Link>
                      </li>
                    ))}
                    <li className="mt-1.5 border-t border-ink/10 pt-1.5">
                      <Link
                        href={link.href}
                        onClick={(event) => event.currentTarget.blur()}
                        className="block px-3 py-2 text-label text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        Todos os recursos
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <Link key={link.href} href={link.href} className="text-label text-ink-soft transition-colors hover:text-ink">
                {link.label}
              </Link>
            ),
          )}
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
