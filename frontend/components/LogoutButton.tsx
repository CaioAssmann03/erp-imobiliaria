"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth";
import { removeCookie } from "@/lib/cookies";

/** Client Component: limpa cookies e o cache de dados do usuário. */
export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    removeCookie(ACCESS_COOKIE);
    removeCookie(REFRESH_COOKIE);
    queryClient.clear();
    router.push("/login");
  };

  return (
    <Button
      variant="ghost"
      title="Sair"
      aria-label="Sair"
      className="h-9 w-full justify-start rounded-control px-3 hover:bg-surface lg:group-data-[collapsed]/sidebar:justify-center lg:group-data-[collapsed]/sidebar:px-0"
      onClick={handleLogout}
    >
      <LogOut className="hidden size-[1.125rem] lg:group-data-[collapsed]/sidebar:block" />
      <span className="lg:group-data-[collapsed]/sidebar:hidden">Sair</span>
    </Button>
  );
}
