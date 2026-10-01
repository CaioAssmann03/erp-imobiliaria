"use client";

import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Brand } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { NavLinks } from "@/components/NavLinks";
import { SettingsDialog } from "@/components/SettingsDialog";
import type { Appearance } from "@/lib/appearance";
import { SIDEBAR_COOKIE } from "@/lib/auth";

/**
 * Client Component: lateral recolhível (lg+). Recolhida mostra só ícones; aberta,
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
      className="group/sidebar flex shrink-0 flex-col gap-4 px-1 transition-[width] duration-200 lg:px-0 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-44 lg:gap-3 lg:py-2 lg:data-[collapsed]:w-12"
    >
      <div className="flex items-center justify-between gap-3 lg:mb-4">
        <Link
          href="/"
          className="flex px-1 py-1 lg:group-data-[collapsed]/sidebar:w-full lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
        >
          <Brand />
        </Link>
        <div className="flex items-center gap-1 lg:hidden">
          <SettingsDialog initial={appearance} />
          <LogoutButton />
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Recolher menu" : "Abrir menu"}
        aria-expanded={open}
        title={open ? "Recolher" : "Abrir menu"}
        className="hidden h-9 items-center gap-2 rounded-control px-3 text-body font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink lg:flex lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
      >
        <PanelLeft className="size-[1.125rem] shrink-0" />
        <span className="lg:group-data-[collapsed]/sidebar:hidden">Recolher</span>
      </button>

      <NavLinks />

      <div className="mt-auto hidden flex-col gap-1 lg:flex">
        <SettingsDialog initial={appearance} />
        <LogoutButton />
      </div>
    </aside>
  );
}
