"use client";

import { useEffect } from "react";

import { savedSidebarOpen, setSidebarOpen } from "../../../_components/shell/sidebar-state";

/**
 * Client Component sem tela: enquanto um condomínio está aberto, recolhe a lateral para dar foco ao conteúdo.
 * Não grava o cookie: a escolha salva da pessoa continua valendo no resto do app, e é ela que volta ao sair.
 * Se a pessoa abrir a lateral aqui, o botão grava a escolha e ela segue aberta ao sair.
 */
export function CollapseSidebar() {
  useEffect(() => {
    setSidebarOpen(false);
    return () => setSidebarOpen(savedSidebarOpen());
  }, []);

  return null;
}
