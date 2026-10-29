"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { railButtonClass, RailLabel } from "./ModuleMenu";

/** Client Component: o servidor revoga o refresh token e apaga os cookies; aqui limpa o cache do usuário. */
export function LogoutButton({ compact = false, rail = false, expanded = false }: { compact?: boolean; rail?: boolean; expanded?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout/", { method: "POST" });
    } finally {
      queryClient.clear();
      router.push("/login");
    }
  };

  if (compact || rail) {
    return (
      <button
        type="button"
        title="Sair"
        aria-label="Sair"
        onClick={handleLogout}
        className={
          rail
            ? railButtonClass(false, false, expanded)
            : "flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface hover:text-ink"
        }
      >
        <LogOut className="size-5 shrink-0" />
        {rail && expanded && <RailLabel>Sair</RailLabel>}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      title="Sair"
      aria-label="Sair"
      className="h-10 w-full justify-start gap-3 rounded-control px-3 hover:bg-surface"
      onClick={handleLogout}
    >
      <LogOut className="size-[1.125rem] shrink-0" />
      Sair
    </Button>
  );
}
