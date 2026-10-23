"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Brand } from "@/components/Brand";
import { LogoutButton } from "./LogoutButton";
import { NavLinks } from "./NavLinks";
import { SettingsDialog } from "./SettingsDialog";
import { SIDEBAR_COOKIE } from "@/lib/auth";

const SIDEBAR_EVENT = "sidebar-change";

const subscribe = (onChange: () => void) => {
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => window.removeEventListener(SIDEBAR_EVENT, onChange);
};
const isOpenNow = () => document.documentElement.dataset.sidebar !== "closed";

/**
 * Client Component: lateral recolhível (só em telas grandes; no celular há a barra do topo e o menu lateral `MobileMenu`). Recolhida mostra só ícones; aberta,
 * só textos. A marca fica sempre visível e o botão de alternar logo abaixo dela. O estado fica em `data-sidebar` no <html>
 * (o script do <head> o lê do cookie antes do primeiro paint, sem piscar) e o CSS recolhe pela variante `sidebar-closed` (globals.css).
 * Padrão: aberta.
 */
export function Sidebar() {
  const open = useSyncExternalStore(subscribe, isOpenNow, () => true);

  const toggle = () => {
    const next = !open;
    document.documentElement.dataset.sidebar = next ? "open" : "closed";
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  return (
    <aside
      className="sticky top-4 hidden h-[calc(100vh-2rem)] w-44 shrink-0 flex-col gap-3 py-2 transition-[width] duration-200 in-data-[sidebar=closed]:w-12 lg:flex"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex px-1 py-1 lg:sidebar-closed:w-full lg:sidebar-closed:justify-center lg:sidebar-closed:px-0"
        >
          <Brand />
        </Link>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Recolher menu" : "Abrir menu"}
        aria-expanded={open}
        title={open ? "Recolher" : "Abrir menu"}
        className="flex h-9 items-center gap-2 rounded-control px-3 text-body font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:sidebar-closed:justify-center lg:sidebar-closed:px-0"
      >
        <PanelLeft className="size-[1.125rem] shrink-0" />
        <span className="lg:sidebar-closed:hidden">Recolher</span>
      </button>

      <NavLinks />

      <div className="mt-auto flex flex-col gap-1">
        <SettingsDialog />
        <LogoutButton />
      </div>
    </aside>
  );
}
