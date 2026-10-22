"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { LogoutButton } from "./LogoutButton";
import { NavLinks } from "./NavLinks";
import { SettingsDialog } from "./SettingsDialog";
import type { Appearance } from "@/lib/appearance";
import { SIDEBAR_COOKIE } from "@/lib/auth";

/**
 * Client Component: lateral recolhível (só em telas grandes; no celular há a barra do topo e o menu lateral `MobileMenu`). Recolhida mostra só ícones; aberta,
 * só textos. A marca fica sempre visível e o botão de alternar logo abaixo dela. O estado vai para um
 * cookie, lido no servidor (AppShell) para não piscar ao carregar. Padrão: aberta.
 */
export function Sidebar({
  defaultOpen,
  appearance,
}: {
  defaultOpen: boolean;
  appearance: Appearance;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <aside
      data-collapsed={open ? undefined : ""}
      className="group/sidebar sticky top-4 hidden h-[calc(100vh-2rem)] w-44 shrink-0 flex-col gap-3 py-2 transition-[width] duration-200 data-[collapsed]:w-12 lg:flex"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex px-1 py-1 lg:group-data-[collapsed]/sidebar:w-full lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
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
        className="flex h-9 items-center gap-2 rounded-control px-3 text-body font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
      >
        <PanelLeft className="size-[1.125rem] shrink-0" />
        <span className="lg:group-data-[collapsed]/sidebar:hidden">Recolher</span>
      </button>

      <NavLinks />

      <div className="mt-auto flex flex-col gap-1">
        <SettingsDialog initial={appearance} />
        <LogoutButton />
      </div>
    </aside>
  );
}
