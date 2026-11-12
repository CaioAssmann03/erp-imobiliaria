"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { MetriLogo } from "@/components/brand/MetriLogo";
import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { CONTACT_HREF, MODULE_LINKS, NAV_LINKS } from "@/app/(marketing)/_components/content";
import { MarketingButton } from "@/app/(marketing)/_components/MarketingButton";

const EASE = [0.22, 1, 0.36, 1] as const;
/** O mesmo corte do cabeçalho: de `md` para cima a navegação já aparece inteira e o menu lateral não faz sentido. */
const DESKTOP_QUERY = "(min-width: 48rem)";
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Menu lateral das páginas públicas, só no celular (abaixo de `md`, onde a navegação do cabeçalho some): um botão à
 * esquerda do logo abre um painel que entra pela esquerda, limpo: só os links do site, os módulos (só os nomes) e o acesso ao sistema. Fecha com o X,
 * com Esc, tocando fora, ao trocar de página ou quando a tela cresce até `md`. Com ele aberto, a página atrás fica parada
 * e o foco fica preso no painel; ao fechar, volta ao botão. No modo leve o painel só aparece, sem deslizar.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const still = useLite();
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  // Trocar de página fecha o menu (o layout é compartilhado, então o componente não remonta). Ajuste durante a renderização, sem efeito.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden"; // a página atrás não rola
    const button = trigger.current;
    const toDesktop = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => toDesktop.matches && close();
    toDesktop.addEventListener("change", onChange);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab" || !panel.current) return;
      // Foco preso: Tab e Shift+Tab giram dentro do painel.
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      document.documentElement.style.overflow = previous;
      toDesktop.removeEventListener("change", onChange);
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open, close]);

  const item = (index: number) => ({
    initial: still ? false : { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, delay: still ? 0 : 0.12 + index * 0.05, ease: EASE },
  });

  const links = [{ href: "/", label: "Início" }, ...NAV_LINKS];
  const current = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-sharp text-ink outline-none transition-colors hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand/60 md:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: still ? 0 : 0.3 }}
              onClick={close}
              className="absolute inset-0 bg-canvas/80"
            />
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              data-lenis-prevent
              initial={{ x: still ? 0 : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: still ? 0 : "-100%" }}
              transition={{ duration: still ? 0 : 0.45, ease: EASE }}
              className="absolute inset-y-0 left-0 flex w-[min(84vw,20rem)] flex-col overflow-y-auto border-r border-ink/10 bg-canvas px-6"
            >
              <div className="flex h-16 shrink-0 items-center justify-between">
                <Link href="/" aria-label="Página inicial" onClick={close}>
                  <MetriLogo className="h-7 w-auto" />
                </Link>
                <button
                  type="button"
                  data-autofocus
                  onClick={close}
                  aria-label="Fechar menu"
                  className="-mr-2 inline-flex size-10 items-center justify-center rounded-sharp text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>

              <nav aria-label="Principal" className="flex-1 pt-8">
                <ul className="space-y-1">
                  {links.map((link, index) => (
                    <motion.li key={link.href} {...item(index)}>
                      <Link
                        href={link.href}
                        onClick={close}
                        aria-current={current(link.href) ? "page" : undefined}
                        className={cn(
                          "block py-2 font-display text-title font-normal transition-colors",
                          current(link.href) ? "text-ink" : "text-ink-soft hover:text-ink",
                        )}
                      >
                        {link.label}
                      </Link>
                      {link.href === "/features" && (
                        <ul className="mt-1 mb-3 space-y-0.5 pl-4">
                          {MODULE_LINKS.map((module) => (
                            <li key={module.href}>
                              <Link
                                href={module.href}
                                onClick={close}
                                aria-current={pathname === module.href ? "page" : undefined}
                                className={cn(
                                  "block py-1.5 text-base transition-colors",
                                  pathname === module.href ? "text-ink" : "text-ink-faint hover:text-ink",
                                )}
                              >
                                {module.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div {...item(links.length)} className="flex shrink-0 flex-col gap-2 pt-6 pb-8">
                <MarketingButton href={CONTACT_HREF} onClick={close} className="h-11">
                  Agendar demonstração
                </MarketingButton>
                {pathname !== "/login" && (
                  <MarketingButton href="/login" variant="outline" onClick={close} className="h-11">
                    Entrar
                  </MarketingButton>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
